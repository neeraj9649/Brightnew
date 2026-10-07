//! Aggregates behind the admin overview and loyalty-analytics screens.
//! Everything is computed live from the operational tables; the period is the
//! last `days` days (default 30) compared against the period before it.

use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::PgPool;

use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use base::{
    error::{ApiError, ApiResponse},
    role::ADMIN_ONLY,
};

#[derive(Debug, Deserialize)]
pub struct PeriodQuery {
    #[serde(default)]
    pub days: Option<i32>,
}

fn db_err(e: sqlx::Error) -> ApiError {
    ApiError::new(e.to_string(), 500)
}

fn days_of(query: &PeriodQuery) -> i32 {
    query.days.unwrap_or(30).clamp(7, 365)
}

/// Percentage change, or null when there is no baseline to compare against.
fn delta_pct(current: f64, previous: f64) -> Value {
    if previous <= 0.0 {
        Value::Null
    } else {
        json!(((current - previous) / previous * 1000.0).round() / 10.0)
    }
}

async fn scalar_i64(pool: &PgPool, sql: &str, days: i32) -> Result<i64, ApiError> {
    sqlx::query_scalar::<_, i64>(sql)
        .bind(days)
        .fetch_one(pool)
        .await
        .map_err(db_err)
}

/// Runs `sql` which must select (day text, value float8) rows for each day of
/// the period, zero-filled.
async fn daily(pool: &PgPool, source: &str, days: i32) -> Result<Vec<Value>, ApiError> {
    let sql = format!(
        r#"SELECT to_char(d::date, 'YYYY-MM-DD') AS day, COALESCE(s.v, 0)::float8 AS v
           FROM generate_series(CURRENT_DATE - ($1::int - 1), CURRENT_DATE, INTERVAL '1 day') d
           LEFT JOIN ({source}) s ON s.day = d::date
           ORDER BY d"#
    );
    let rows: Vec<(String, f64)> = sqlx::query_as(&sql).bind(days).fetch_all(pool).await.map_err(db_err)?;
    Ok(rows.into_iter().map(|(d, v)| json!({ "date": d, "value": v })).collect())
}

/// "metric": { total, delta_pct, series } helper built from a current-period
/// total query, a previous-period total query and a daily source.
async fn metric(
    pool: &PgPool,
    current: &str,
    previous: &str,
    series_source: &str,
    days: i32,
    total_override: Option<f64>,
) -> Result<Value, ApiError> {
    let cur = scalar_i64(pool, current, days).await? as f64;
    let prev = scalar_i64(pool, previous, days).await? as f64;
    let series = daily(pool, series_source, days).await?;
    Ok(json!({ "total": total_override.unwrap_or(cur), "period": cur, "delta_pct": delta_pct(cur, prev), "series": series }))
}

async fn overview_handler(
    pool: web::Data<PgPool>,
    query: web::Query<PeriodQuery>,
) -> Result<ApiResponse<Value>, ApiError> {
    let pool = pool.get_ref();
    let days = days_of(&query);

    let members_total = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM users WHERE role = 'customer'").fetch_one(pool).await.map_err(db_err)?;
    let active_total = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM bookings WHERE status NOT IN ('completed', 'cancelled')").fetch_one(pool).await.map_err(db_err)?;
    let pending_total = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM redemptions WHERE status = 'requested'").fetch_one(pool).await.map_err(db_err)?;
    let wings_total = sqlx::query_scalar::<_, i64>("SELECT COALESCE(SUM(points), 0)::BIGINT FROM reward_transactions WHERE points > 0 AND COALESCE(source_type, '') <> 'redemption_refund'").fetch_one(pool).await.map_err(db_err)?;

    let members = metric(
        pool,
        "SELECT COUNT(*) FROM users WHERE role = 'customer' AND created_at >= CURRENT_DATE - ($1::int - 1)",
        "SELECT COUNT(*) FROM users WHERE role = 'customer' AND created_at >= CURRENT_DATE - (2 * $1::int - 1) AND created_at < CURRENT_DATE - ($1::int - 1)",
        "SELECT created_at::date AS day, COUNT(*) AS v FROM users WHERE role = 'customer' GROUP BY 1",
        days,
        Some(members_total as f64),
    ).await?;
    let active = metric(
        pool,
        "SELECT COUNT(*) FROM bookings WHERE status <> 'cancelled' AND created_at >= CURRENT_DATE - ($1::int - 1)",
        "SELECT COUNT(*) FROM bookings WHERE status <> 'cancelled' AND created_at >= CURRENT_DATE - (2 * $1::int - 1) AND created_at < CURRENT_DATE - ($1::int - 1)",
        "SELECT created_at::date AS day, COUNT(*) AS v FROM bookings WHERE status <> 'cancelled' GROUP BY 1",
        days,
        Some(active_total as f64),
    ).await?;
    let wings = metric(
        pool,
        "SELECT COALESCE(SUM(points), 0)::BIGINT FROM reward_transactions WHERE points > 0 AND COALESCE(source_type, '') <> 'redemption_refund' AND created_at >= CURRENT_DATE - ($1::int - 1)",
        "SELECT COALESCE(SUM(points), 0)::BIGINT FROM reward_transactions WHERE points > 0 AND COALESCE(source_type, '') <> 'redemption_refund' AND created_at >= CURRENT_DATE - (2 * $1::int - 1) AND created_at < CURRENT_DATE - ($1::int - 1)",
        "SELECT created_at::date AS day, SUM(points) AS v FROM reward_transactions WHERE points > 0 AND COALESCE(source_type, '') <> 'redemption_refund' GROUP BY 1",
        days,
        Some(wings_total as f64),
    ).await?;
    let pending = metric(
        pool,
        "SELECT COUNT(*) FROM redemptions WHERE created_at >= CURRENT_DATE - ($1::int - 1)",
        "SELECT COUNT(*) FROM redemptions WHERE created_at >= CURRENT_DATE - (2 * $1::int - 1) AND created_at < CURRENT_DATE - ($1::int - 1)",
        "SELECT created_at::date AS day, COUNT(*) AS v FROM redemptions GROUP BY 1",
        days,
        Some(pending_total as f64),
    ).await?;

    let trend = daily(pool, "SELECT created_at::date AS day, COUNT(*) AS v FROM bookings GROUP BY 1", days).await?;

    let mix: Vec<(String, i64)> = sqlx::query_as(
        "SELECT type, COUNT(*) FROM bookings WHERE created_at >= CURRENT_DATE - ($1::int - 1) GROUP BY type ORDER BY 2 DESC",
    ).bind(days).fetch_all(pool).await.map_err(db_err)?;

    let recent: Vec<(String, String, String, String, String, chrono::DateTime<chrono::Utc>, uuid::Uuid)> = sqlx::query_as(
        r#"SELECT b.display_code, TRIM(u.first_name || ' ' || COALESCE(u.last_name, '')), b.type, b.status,
                  COALESCE(b.details->>'destination', b.details->>'to', b.details->>'country', b.details->>'region', ''),
                  b.created_at, b.id
           FROM bookings b JOIN users u ON u.id = b.user_id ORDER BY b.created_at DESC LIMIT 6"#,
    ).fetch_all(pool).await.map_err(db_err)?;

    let queue: Vec<(String, String, String, i32, chrono::DateTime<chrono::Utc>, String, uuid::Uuid)> = sqlx::query_as(
        r#"SELECT r.display_code, TRIM(u.first_name || ' ' || COALESCE(u.last_name, '')), r.item_name, r.wings_cost,
                  r.created_at, r.status, r.id
           FROM redemptions r JOIN users u ON u.id = r.user_id
           WHERE r.status IN ('requested', 'approved') ORDER BY r.created_at DESC LIMIT 5"#,
    ).fetch_all(pool).await.map_err(db_err)?;

    Ok(ApiResponse(json!({
        "days": days,
        "members": members,
        "active_bookings": active,
        "wings_issued": wings,
        "pending_redemptions": pending,
        "booking_trends": trend,
        "service_mix": mix.into_iter().map(|(t, c)| json!({ "type": t, "count": c })).collect::<Vec<_>>(),
        "recent_bookings": recent.into_iter().map(|(code, customer, kind, status, place, at, id)| json!({ "id": id, "display_code": code, "customer": customer, "type": kind, "status": status, "place": place, "created_at": at })).collect::<Vec<_>>(),
        "redemption_queue": queue.into_iter().map(|(code, customer, item, wings, at, status, id)| json!({ "id": id, "display_code": code, "customer": customer, "reward": item, "wings": wings, "created_at": at, "status": status })).collect::<Vec<_>>(),
    })))
}

async fn loyalty_analytics_handler(
    pool: web::Data<PgPool>,
    query: web::Query<PeriodQuery>,
) -> Result<ApiResponse<Value>, ApiError> {
    let pool = pool.get_ref();
    let days = days_of(&query);

    let cur_win = "created_at >= CURRENT_DATE - ($1::int - 1)";
    let prev_win = "created_at >= CURRENT_DATE - (2 * $1::int - 1) AND created_at < CURRENT_DATE - ($1::int - 1)";

    let new_members = metric(
        pool,
        &format!("SELECT COUNT(*) FROM users WHERE role = 'customer' AND {cur_win}"),
        &format!("SELECT COUNT(*) FROM users WHERE role = 'customer' AND {prev_win}"),
        "SELECT created_at::date AS day, COUNT(*) AS v FROM users WHERE role = 'customer' GROUP BY 1",
        days,
        None,
    ).await?;

    // Booking completion rate = completed / created, per window.
    let rate = |completed: i64, total: i64| if total == 0 { 0.0 } else { (completed as f64 / total as f64 * 1000.0).round() / 10.0 };
    let total_cur = scalar_i64(pool, &format!("SELECT COUNT(*) FROM bookings WHERE {cur_win}"), days).await?;
    let done_cur = scalar_i64(pool, &format!("SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND {cur_win}"), days).await?;
    let total_prev = scalar_i64(pool, &format!("SELECT COUNT(*) FROM bookings WHERE {prev_win}"), days).await?;
    let done_prev = scalar_i64(pool, &format!("SELECT COUNT(*) FROM bookings WHERE status = 'completed' AND {prev_win}"), days).await?;
    let rate_cur = rate(done_cur, total_cur);
    let rate_prev = rate(done_prev, total_prev);

    let issued = metric(
        pool,
        &format!("SELECT COALESCE(SUM(points), 0)::BIGINT FROM reward_transactions WHERE points > 0 AND COALESCE(source_type, '') <> 'redemption_refund' AND {cur_win}"),
        &format!("SELECT COALESCE(SUM(points), 0)::BIGINT FROM reward_transactions WHERE points > 0 AND COALESCE(source_type, '') <> 'redemption_refund' AND {prev_win}"),
        "SELECT created_at::date AS day, SUM(points) AS v FROM reward_transactions WHERE points > 0 AND COALESCE(source_type, '') <> 'redemption_refund' GROUP BY 1",
        days,
        None,
    ).await?;
    let redeemed = metric(
        pool,
        &format!("SELECT COALESCE(SUM(-points), 0)::BIGINT FROM reward_transactions WHERE source_type = 'redemption' AND {cur_win}"),
        &format!("SELECT COALESCE(SUM(-points), 0)::BIGINT FROM reward_transactions WHERE source_type = 'redemption' AND {prev_win}"),
        "SELECT created_at::date AS day, SUM(-points) AS v FROM reward_transactions WHERE source_type = 'redemption' GROUP BY 1",
        days,
        None,
    ).await?;

    // Referral conversion: of friends who joined in the window, how many have
    // had the referral reward credited.
    let ref_total = scalar_i64(pool, &format!("SELECT COUNT(*) FROM referrals WHERE {cur_win}"), days).await?;
    let ref_done = scalar_i64(pool, &format!("SELECT COUNT(*) FROM referrals r WHERE {} AND EXISTS (SELECT 1 FROM reward_transactions t WHERE t.reason = 'referral' AND t.source_id = r.referred_id)", cur_win.replace("created_at", "r.created_at")), days).await?;
    let ref_total_prev = scalar_i64(pool, &format!("SELECT COUNT(*) FROM referrals WHERE {prev_win}"), days).await?;
    let ref_done_prev = scalar_i64(pool, &format!("SELECT COUNT(*) FROM referrals r WHERE {} AND EXISTS (SELECT 1 FROM reward_transactions t WHERE t.reason = 'referral' AND t.source_id = r.referred_id)", prev_win.replace("created_at", "r.created_at")), days).await?;

    // Redemption approval time: hours from request to approval/rejection.
    let avg_hours = |sql: String| async move {
        sqlx::query_scalar::<_, Option<f64>>(&sql).bind(days).fetch_one(pool).await.map_err(db_err)
    };
    let approval_cur = avg_hours(format!("SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(approved_at, rejected_at) - created_at)) / 3600.0)::float8 FROM redemptions WHERE COALESCE(approved_at, rejected_at) IS NOT NULL AND {cur_win}")).await?;
    let approval_prev = avg_hours(format!("SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(approved_at, rejected_at) - created_at)) / 3600.0)::float8 FROM redemptions WHERE COALESCE(approved_at, rejected_at) IS NOT NULL AND {prev_win}")).await?;
    let approval_series = daily(pool, "SELECT created_at::date AS day, AVG(EXTRACT(EPOCH FROM (COALESCE(approved_at, rejected_at) - created_at)) / 3600.0)::float8 AS v FROM redemptions WHERE COALESCE(approved_at, rejected_at) IS NOT NULL GROUP BY 1", days).await?;

    let completion_series = daily(pool, "SELECT created_at::date AS day, COUNT(*) AS v FROM bookings WHERE status = 'completed' GROUP BY 1", days).await?;
    let created_series = daily(pool, "SELECT created_at::date AS day, COUNT(*) AS v FROM bookings GROUP BY 1", days).await?;

    let tiers: Vec<(String, i64)> = sqlx::query_as(
        "SELECT membership_tier, COUNT(*) FROM users WHERE role = 'customer' GROUP BY 1",
    ).fetch_all(pool).await.map_err(db_err)?;

    Ok(ApiResponse(json!({
        "days": days,
        "new_members": new_members,
        "booking_completion": { "rate": rate_cur, "delta_pp": ((rate_cur - rate_prev) * 10.0).round() / 10.0, "completed": done_cur, "total": total_cur },
        "wings_issued": issued,
        "wings_redeemed": redeemed,
        "referral_conversion": { "rate": rate(ref_done, ref_total), "delta_pp": ((rate(ref_done, ref_total) - rate(ref_done_prev, ref_total_prev)) * 10.0).round() / 10.0, "referred": ref_total, "completed": ref_done },
        "approval_time": { "hours": approval_cur.map(|h| (h * 10.0).round() / 10.0), "delta_pct": match (approval_cur, approval_prev) { (Some(c), Some(p)) => delta_pct(c, p), _ => Value::Null }, "series": approval_series },
        "completion_series": completion_series,
        "created_series": created_series,
        "tier_distribution": tiers.into_iter().map(|(t, c)| json!({ "tier": t, "count": c })).collect::<Vec<_>>(),
    })))
}

pub fn admin_portal_routes(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/admin/portal")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, ADMIN_ONLY).await
            }))
            .route("/overview", web::get().to(overview_handler))
            .route("/loyalty-analytics", web::get().to(loyalty_analytics_handler)),
    );
}
