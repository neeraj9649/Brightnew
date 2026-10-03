use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use base::error::{ApiError, ApiResponse};
use base::role::STAFF;

#[derive(Debug, Default, Deserialize)]
pub struct PnlQuery {
    #[serde(default)]
    pub from: Option<DateTime<Utc>>,
    #[serde(default)]
    pub to: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct BookingPnlDTO {
    pub id: Uuid,
    pub display_code: String,
    #[serde(rename = "type")]
    pub booking_type: String,
    pub status: String,
    pub revenue: f64,
    pub expense: f64,
    pub profit: f64,
}

#[derive(Debug, Serialize)]
pub struct PnlTotals {
    pub revenue: f64,
    pub expense: f64,
    pub profit: f64,
    pub count: i64,
}

#[derive(Debug, Serialize)]
pub struct PnlReportDTO {
    pub overall: PnlTotals,
    pub bookings: Vec<BookingPnlDTO>,
}

/// Staff-only: per-booking and overall PnL. Revenue = bookings.final_cost,
/// expense = SUM(booking_expenses.amount), profit = revenue - expense.
async fn financials_pnl_handler(
    pool: web::Data<PgPool>,
    query: web::Query<PnlQuery>,
) -> Result<ApiResponse<PnlReportDTO>, ApiError> {
    let q = query.into_inner();
    let rows = sqlx::query!(
        r#"
        SELECT b.id AS "id!", b.display_code AS "display_code!",
            b.type AS "booking_type!", b.status AS "status!",
            b.final_cost AS "revenue!",
            COALESCE(e.expense, 0) AS "expense!"
        FROM bookings b
        LEFT JOIN (
            SELECT booking_id, SUM(amount) AS expense
            FROM booking_expenses GROUP BY booking_id
        ) e ON e.booking_id = b.id
        WHERE ($1::timestamptz IS NULL OR b.created_at >= $1)
            AND ($2::timestamptz IS NULL OR b.created_at <= $2)
        ORDER BY b.created_at DESC
        "#,
        q.from,
        q.to
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(|e| ApiError::new(&e.to_string(), 500))?;

    let to_f64 = |d: bigdecimal::BigDecimal| d.to_string().parse().unwrap_or(0.0);
    let bookings: Vec<BookingPnlDTO> = rows
        .into_iter()
        .map(|r| {
            let revenue = to_f64(r.revenue);
            let expense = to_f64(r.expense);
            BookingPnlDTO {
                id: r.id,
                display_code: r.display_code,
                booking_type: r.booking_type,
                status: r.status,
                revenue,
                expense,
                profit: revenue - expense,
            }
        })
        .collect();

    let overall = PnlTotals {
        revenue: bookings.iter().map(|b| b.revenue).sum(),
        expense: bookings.iter().map(|b| b.expense).sum(),
        profit: bookings.iter().map(|b| b.profit).sum(),
        count: bookings.len() as i64,
    };

    Ok(ApiResponse(PnlReportDTO { overall, bookings }))
}

pub fn financials_routes(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/admin/financials")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, STAFF).await
            }))
            .route("/pnl", web::get().to(financials_pnl_handler)),
    );
}
