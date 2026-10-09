use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};
use chrono::{DateTime, Duration, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;
use uuid::Uuid;

use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use base::error::{ApiError, ApiResponse};
use base::jwt_claims::JwtClaims;
use base::role::{ADMIN_ONLY, STAFF};
use rewards::domain::tier_config::tier_rank;

// ---- DTOs -----------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct RewardItemDTO {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub wings_cost: i32,
    pub image_file_id: Option<String>,
    pub is_active: bool,
    pub validity_days: i32,
    pub terms: Option<String>,
    /// NULL means unlimited.
    pub stock: Option<i32>,
    pub reward_value: Option<String>,
    pub min_tier: String,
    pub destination: Option<String>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct RedemptionDTO {
    pub id: Uuid,
    pub display_code: String,
    pub reward_item_id: Uuid,
    pub item_name: String,
    pub wings_cost: i32,
    pub status: String,
    pub voucher_code: Option<String>,
    pub valid_till: Option<NaiveDate>,
    pub admin_note: Option<String>,
    pub category: Option<String>,
    pub image_file_id: Option<String>,
    pub reward_value: Option<String>,
    pub terms: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
    pub approved_at: Option<DateTime<Utc>>,
    pub issued_at: Option<DateTime<Utc>>,
    pub delivered_at: Option<DateTime<Utc>>,
    pub rejected_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct AdminRedemptionDTO {
    #[sqlx(flatten)]
    #[serde(flatten)]
    pub redemption: RedemptionDTO,
    pub user_id: Uuid,
    pub user_name: String,
    pub user_phone: String,
    pub membership_code: String,
    pub membership_tier: String,
    pub balance: i32,
    pub lifetime_wings: i64,
}

#[derive(Debug, Deserialize)]
pub struct CreateRedemptionDTO {
    pub reward_item_id: Uuid,
}

#[derive(Debug, Deserialize)]
pub struct UpdateStatusDTO {
    pub status: String,
    #[serde(default)]
    pub voucher_code: Option<String>,
    #[serde(default)]
    pub valid_till: Option<NaiveDate>,
    #[serde(default)]
    pub admin_note: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateRewardItemDTO {
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub category: Option<String>,
    pub wings_cost: i32,
    #[serde(default)]
    pub image_file_id: Option<String>,
    #[serde(default)]
    pub is_active: Option<bool>,
    #[serde(default)]
    pub validity_days: Option<i32>,
    #[serde(default)]
    pub terms: Option<String>,
    #[serde(default)]
    pub stock: Option<i32>,
    #[serde(default)]
    pub reward_value: Option<String>,
    #[serde(default)]
    pub min_tier: Option<String>,
    #[serde(default)]
    pub destination: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateRewardItemDTO {
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub category: Option<String>,
    #[serde(default)]
    pub wings_cost: Option<i32>,
    #[serde(default)]
    pub image_file_id: Option<String>,
    #[serde(default)]
    pub is_active: Option<bool>,
    #[serde(default)]
    pub validity_days: Option<i32>,
    #[serde(default)]
    pub terms: Option<String>,
    /// Send `-1` to make the stock unlimited again.
    #[serde(default)]
    pub stock: Option<i32>,
    #[serde(default)]
    pub reward_value: Option<String>,
    #[serde(default)]
    pub min_tier: Option<String>,
    #[serde(default)]
    pub destination: Option<String>,
}

const ACTIVE: &[&str] = &["requested", "approved", "voucher_issued"];
const ALL_STATUSES: &[&str] =
    &["requested", "approved", "voucher_issued", "delivered", "rejected", "cancelled"];

const ITEM_COLUMNS: &str = "id, name, description, category, wings_cost, image_file_id, is_active, \
     validity_days, terms, stock, reward_value, min_tier, destination, updated_at";

const REDEMPTION_SELECT: &str = r#"
    SELECT r.id, r.display_code, r.reward_item_id, r.item_name, r.wings_cost, r.status,
           r.voucher_code, r.valid_till, r.admin_note,
           ri.category, ri.image_file_id, ri.reward_value, ri.terms,
           r.created_at, r.updated_at, r.approved_at, r.issued_at, r.delivered_at, r.rejected_at
    FROM redemptions r
    LEFT JOIN reward_items ri ON ri.id = r.reward_item_id
"#;

fn db_err(e: sqlx::Error) -> ApiError {
    ApiError::new(e.to_string(), 500)
}

fn gen_voucher() -> String {
    format!("BW-RDM-{}", Uuid::new_v4().simple().to_string()[..8].to_uppercase())
}

async fn fetch_redemption(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    id: Uuid,
) -> Result<RedemptionDTO, ApiError> {
    sqlx::query_as::<_, RedemptionDTO>(&format!("{REDEMPTION_SELECT} WHERE r.id = $1"))
        .bind(id)
        .fetch_one(&mut **tx)
        .await
        .map_err(db_err)
}

// ---- Customer -------------------------------------------------------------

/// Browseable catalog (active items only).
async fn catalog_handler(
    pool: web::Data<PgPool>,
) -> Result<ApiResponse<Vec<RewardItemDTO>>, ApiError> {
    let rows = sqlx::query_as::<_, RewardItemDTO>(&format!(
        "SELECT {ITEM_COLUMNS} FROM reward_items WHERE is_active = TRUE ORDER BY wings_cost"
    ))
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(rows))
}

/// Request a redemption. The guarded balance update, the stock decrement and
/// both ledger/request inserts share one transaction, so concurrent requests
/// cannot overspend or oversell, and a request can never exist without its
/// matching Wings debit.
async fn create_redemption_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    body: web::Json<CreateRedemptionDTO>,
) -> Result<ApiResponse<RedemptionDTO>, ApiError> {
    let rid = Uuid::new_v4();
    let mut tx = pool.begin().await.map_err(db_err)?;
    let item: (String, i32, bool, Option<i32>, String) = sqlx::query_as(
        "SELECT name, wings_cost, is_active, stock, min_tier FROM reward_items WHERE id = $1 FOR UPDATE",
    )
    .bind(body.reward_item_id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(db_err)?
    .ok_or_else(|| ApiError::new("Reward not found", 404))?;
    let (name, wings_cost, is_active, stock, min_tier) = item;
    let member_tier: String = sqlx::query_scalar("SELECT membership_tier FROM users WHERE id = $1")
        .bind(claims.sub)
        .fetch_one(&mut *tx)
        .await
        .map_err(db_err)?;
    if tier_rank(&member_tier) < tier_rank(&min_tier) {
        return Err(ApiError::new(format!("This reward is for {min_tier} members and above"), 403));
    }

    if !is_active {
        return Err(ApiError::new("Reward is not available", 400));
    }
    if stock == Some(0) {
        return Err(ApiError::new("This reward is out of stock", 400));
    }
    let wallet = sqlx::query_scalar::<_, Uuid>(
        "UPDATE users SET tokens = tokens - $1 WHERE id = $2 AND tokens >= $1 RETURNING id",
    )
    .bind(wings_cost)
    .bind(claims.sub)
    .fetch_optional(&mut *tx)
    .await
    .map_err(db_err)?;
    if wallet.is_none() {
        return Err(ApiError::new("Not enough Wings to redeem this reward", 400));
    }
    if stock.is_some() {
        sqlx::query("UPDATE reward_items SET stock = stock - 1 WHERE id = $1")
            .bind(body.reward_item_id)
            .execute(&mut *tx)
            .await
            .map_err(db_err)?;
    }

    sqlx::query(
        r#"INSERT INTO reward_transactions
           (id, user_id, points, reason, source_type, source_id, description, created_by)
           VALUES ($1, $2, $3, 'redemption', 'redemption', $1, $4, $2)"#,
    )
    .bind(rid)
    .bind(claims.sub)
    .bind(-wings_cost)
    .bind(format!("Redeemed: {name}"))
    .execute(&mut *tx)
    .await
    .map_err(db_err)?;

    sqlx::query(
        "INSERT INTO redemptions (id, user_id, reward_item_id, item_name, wings_cost) VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(rid)
    .bind(claims.sub)
    .bind(body.reward_item_id)
    .bind(&name)
    .bind(wings_cost)
    .execute(&mut *tx)
    .await
    .map_err(db_err)?;
    let dto = fetch_redemption(&mut tx, rid).await?;
    tx.commit().await.map_err(db_err)?;
    Ok(ApiResponse(dto))
}

/// The customer's own redemption history (for the "track activities" view).
async fn my_redemptions_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
) -> Result<ApiResponse<Vec<RedemptionDTO>>, ApiError> {
    let rows = sqlx::query_as::<_, RedemptionDTO>(&format!(
        "{REDEMPTION_SELECT} WHERE r.user_id = $1 ORDER BY r.created_at DESC"
    ))
    .bind(claims.sub)
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(rows))
}

/// Customer cancels their own still-pending request and gets the Wings back.
async fn cancel_redemption_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<RedemptionDTO>, ApiError> {
    let id = path.into_inner();
    let mut tx = pool.begin().await.map_err(db_err)?;
    let (wings_cost, status, item_id): (i32, String, Uuid) = sqlx::query_as(
        "SELECT wings_cost, status, reward_item_id FROM redemptions WHERE id = $1 AND user_id = $2 FOR UPDATE",
    )
    .bind(id)
    .bind(claims.sub)
    .fetch_optional(&mut *tx)
    .await
    .map_err(db_err)?
    .ok_or_else(|| ApiError::new("Redemption not found", 404))?;

    if status != "requested" {
        return Err(ApiError::new("Only pending requests can be cancelled", 400));
    }

    refund_in_transaction(&mut tx, claims.sub, id, item_id, wings_cost, "Redemption cancelled").await?;
    sqlx::query("UPDATE redemptions SET status = 'cancelled', updated_at = NOW() WHERE id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(db_err)?;
    let dto = fetch_redemption(&mut tx, id).await?;
    tx.commit().await.map_err(db_err)?;
    Ok(ApiResponse(dto))
}

// ---- Admin: redemption queue ---------------------------------------------

async fn list_redemptions_handler(
    pool: web::Data<PgPool>,
) -> Result<ApiResponse<Vec<AdminRedemptionDTO>>, ApiError> {
    let rows = sqlx::query_as::<_, AdminRedemptionDTO>(
        r#"SELECT r.id, r.display_code, r.reward_item_id, r.item_name, r.wings_cost, r.status,
                  r.voucher_code, r.valid_till, r.admin_note,
                  ri.category, ri.image_file_id, ri.reward_value, ri.terms,
                  r.created_at, r.updated_at, r.approved_at, r.issued_at, r.delivered_at, r.rejected_at,
                  r.user_id,
                  TRIM(u.first_name || ' ' || COALESCE(u.last_name, '')) AS user_name,
                  u.phone AS user_phone, u.membership_code, u.membership_tier,
                  u.tokens AS balance,
                  u.lifetime_points_earned AS lifetime_wings
           FROM redemptions r
           JOIN users u ON u.id = r.user_id
           LEFT JOIN reward_items ri ON ri.id = r.reward_item_id
           ORDER BY r.created_at DESC"#,
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(rows))
}

/// Advance a redemption through the pipeline. Rejecting an active (already
/// paid) request refunds the Wings; issuing a voucher auto-mints a code if the
/// admin didn't supply one and stamps the validity date from the catalog item.
async fn update_status_handler(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    body: web::Json<UpdateStatusDTO>,
) -> Result<ApiResponse<RedemptionDTO>, ApiError> {
    let id = path.into_inner();
    let body = body.into_inner();

    if !ALL_STATUSES.contains(&body.status.as_str()) {
        return Err(ApiError::new("Invalid status", 400));
    }

    let mut tx = pool.begin().await.map_err(db_err)?;
    let (user_id, wings_cost, cur_status, item_id): (Uuid, i32, String, Uuid) = sqlx::query_as(
        "SELECT user_id, wings_cost, status, reward_item_id FROM redemptions WHERE id = $1 FOR UPDATE",
    )
    .bind(id)
    .fetch_optional(&mut *tx)
    .await
    .map_err(db_err)?
    .ok_or_else(|| ApiError::new("Redemption not found", 404))?;

    let allowed = match cur_status.as_str() {
        "requested" => matches!(
            body.status.as_str(),
            "requested" | "approved" | "voucher_issued" | "rejected"
        ),
        "approved" => matches!(body.status.as_str(), "approved" | "voucher_issued" | "rejected"),
        "voucher_issued" => {
            matches!(body.status.as_str(), "voucher_issued" | "delivered" | "rejected")
        }
        "delivered" | "rejected" | "cancelled" => body.status == cur_status,
        _ => false,
    };
    if !allowed {
        return Err(ApiError::new("Invalid redemption status transition", 400));
    }

    if body.status == "rejected" && ACTIVE.contains(&cur_status.as_str()) {
        refund_in_transaction(&mut tx, user_id, id, item_id, wings_cost, "Redemption rejected").await?;
    }

    let issuing = body.status == "voucher_issued" && cur_status != "voucher_issued";
    let voucher = match (body.status.as_str(), &body.voucher_code) {
        ("voucher_issued", None) if issuing => Some(gen_voucher()),
        _ => body
            .voucher_code
            .as_ref()
            .map(|code| code.trim().to_string())
            .filter(|code| !code.is_empty()),
    };
    let valid_till = if body.status == "voucher_issued" {
        match body.valid_till {
            Some(date) => Some(date),
            None if issuing => {
                let days: i32 = sqlx::query_scalar("SELECT validity_days FROM reward_items WHERE id = $1")
                    .bind(item_id)
                    .fetch_one(&mut *tx)
                    .await
                    .map_err(db_err)?;
                Some((Utc::now() + Duration::days(days as i64)).date_naive())
            }
            None => None,
        }
    } else {
        None
    };

    sqlx::query(
        r#"UPDATE redemptions SET
               status = $2,
               voucher_code = COALESCE($3, voucher_code),
               valid_till = COALESCE($4, valid_till),
               admin_note = COALESCE($5, admin_note),
               approved_at = CASE WHEN $2 IN ('approved', 'voucher_issued', 'delivered')
                                  THEN COALESCE(approved_at, NOW()) ELSE approved_at END,
               issued_at = CASE WHEN $2 IN ('voucher_issued', 'delivered')
                                THEN COALESCE(issued_at, NOW()) ELSE issued_at END,
               delivered_at = CASE WHEN $2 = 'delivered'
                                   THEN COALESCE(delivered_at, NOW()) ELSE delivered_at END,
               rejected_at = CASE WHEN $2 = 'rejected'
                                  THEN COALESCE(rejected_at, NOW()) ELSE rejected_at END,
               updated_at = NOW()
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(&body.status)
    .bind(voucher)
    .bind(valid_till)
    .bind(body.admin_note)
    .execute(&mut *tx)
    .await
    .map_err(db_err)?;
    let dto = fetch_redemption(&mut tx, id).await?;
    tx.commit().await.map_err(db_err)?;
    Ok(ApiResponse(dto))
}

// ---- Admin: catalog -------------------------------------------------------

async fn list_items_handler(
    pool: web::Data<PgPool>,
) -> Result<ApiResponse<Vec<RewardItemDTO>>, ApiError> {
    let rows = sqlx::query_as::<_, RewardItemDTO>(&format!(
        "SELECT {ITEM_COLUMNS} FROM reward_items ORDER BY created_at DESC"
    ))
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(rows))
}

async fn create_item_handler(
    pool: web::Data<PgPool>,
    body: web::Json<CreateRewardItemDTO>,
) -> Result<ApiResponse<RewardItemDTO>, ApiError> {
    let b = body.into_inner();
    if b.name.trim().is_empty() || b.wings_cost <= 0 {
        return Err(ApiError::new("Reward name and positive Wings cost are required", 400));
    }
    if b.min_tier.as_deref().is_some_and(|t| !matches!(t, "Silver" | "Gold" | "Platinum" | "Titanium")) {
        return Err(ApiError::new("Minimum tier must be Silver, Gold, Platinum or Titanium", 400));
    }
    if b.validity_days.is_some_and(|days| days <= 0) || b.stock.is_some_and(|stock| stock < 0) {
        return Err(ApiError::new("Validity and stock must be positive numbers", 400));
    }
    let r = sqlx::query_as::<_, RewardItemDTO>(&format!(
        r#"INSERT INTO reward_items
               (name, description, category, wings_cost, image_file_id, is_active,
                validity_days, terms, stock, reward_value, min_tier, destination)
           VALUES ($1, $2, $3, $4, $5, COALESCE($6, TRUE), COALESCE($7, 90), $8, $9, $10, COALESCE($11, 'Silver'), $12)
           RETURNING {ITEM_COLUMNS}"#
    ))
    .bind(b.name.trim())
    .bind(b.description)
    .bind(b.category)
    .bind(b.wings_cost)
    .bind(b.image_file_id)
    .bind(b.is_active)
    .bind(b.validity_days)
    .bind(b.terms)
    .bind(b.stock)
    .bind(b.reward_value)
    .bind(b.min_tier)
    .bind(b.destination)
    .fetch_one(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(r))
}

async fn update_item_handler(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    body: web::Json<UpdateRewardItemDTO>,
) -> Result<ApiResponse<RewardItemDTO>, ApiError> {
    let id = path.into_inner();
    let b = body.into_inner();
    if b.name.as_deref().is_some_and(|name| name.trim().is_empty())
        || b.wings_cost.is_some_and(|cost| cost <= 0)
    {
        return Err(ApiError::new("Reward name and positive Wings cost are required", 400));
    }
    if b.min_tier.as_deref().is_some_and(|t| !matches!(t, "Silver" | "Gold" | "Platinum" | "Titanium")) {
        return Err(ApiError::new("Minimum tier must be Silver, Gold, Platinum or Titanium", 400));
    }
    if b.validity_days.is_some_and(|days| days <= 0) || b.stock.is_some_and(|stock| stock < -1) {
        return Err(ApiError::new("Validity and stock must be positive numbers", 400));
    }
    let clear_stock = b.stock == Some(-1);
    let r = sqlx::query_as::<_, RewardItemDTO>(&format!(
        r#"UPDATE reward_items SET
               name = COALESCE($2, name),
               description = COALESCE($3, description),
               category = COALESCE($4, category),
               wings_cost = COALESCE($5, wings_cost),
               image_file_id = COALESCE($6, image_file_id),
               is_active = COALESCE($7, is_active),
               validity_days = COALESCE($8, validity_days),
               terms = COALESCE($9, terms),
               stock = CASE WHEN $11 THEN NULL ELSE COALESCE($10, stock) END,
               reward_value = COALESCE($12, reward_value),
               min_tier = COALESCE($13, min_tier),
               destination = COALESCE($14, destination),
               updated_at = NOW()
           WHERE id = $1
           RETURNING {ITEM_COLUMNS}"#
    ))
    .bind(id)
    .bind(b.name.map(|n| n.trim().to_string()))
    .bind(b.description)
    .bind(b.category)
    .bind(b.wings_cost)
    .bind(b.image_file_id)
    .bind(b.is_active)
    .bind(b.validity_days)
    .bind(b.terms)
    .bind(if clear_stock { None } else { b.stock })
    .bind(clear_stock)
    .bind(b.reward_value)
    .bind(b.min_tier)
    .bind(b.destination)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(db_err)?
    .ok_or_else(|| ApiError::new("Reward not found", 404))?;
    Ok(ApiResponse(r))
}

// ---- helpers --------------------------------------------------------------

async fn refund_in_transaction(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    user_id: Uuid,
    redemption_id: Uuid,
    item_id: Uuid,
    wings: i32,
    why: &str,
) -> Result<(), ApiError> {
    sqlx::query("UPDATE users SET tokens = tokens + $1 WHERE id = $2")
        .bind(wings)
        .bind(user_id)
        .execute(&mut **tx)
        .await
        .map_err(db_err)?;
    // Limited-stock rewards go back on the shelf.
    sqlx::query("UPDATE reward_items SET stock = stock + 1 WHERE id = $1 AND stock IS NOT NULL")
        .bind(item_id)
        .execute(&mut **tx)
        .await
        .map_err(db_err)?;
    sqlx::query(
        r#"INSERT INTO reward_transactions
           (id, user_id, points, reason, source_type, source_id, description)
           VALUES ($1, $2, $3, 'redemption', 'redemption_refund', $4, $5)"#,
    )
    .bind(Uuid::new_v4())
    .bind(user_id)
    .bind(wings)
    .bind(redemption_id)
    .bind(format!("{why} (refund)"))
    .execute(&mut **tx)
    .await
    .map_err(db_err)?;
    Ok(())
}

// ---- routes ---------------------------------------------------------------

pub fn redemption_routes(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/redemptions")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, &[]).await
            }))
            .route("/catalog", web::get().to(catalog_handler))
            .route("", web::post().to(create_redemption_handler))
            .route("/me", web::get().to(my_redemptions_handler))
            .route("/{id}/cancel", web::post().to(cancel_redemption_handler)),
    )
    .service(
        web::scope("/admin/redemptions")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, STAFF).await
            }))
            .route("", web::get().to(list_redemptions_handler))
            .route("/{id}/status", web::post().to(update_status_handler)),
    )
    .service(
        web::scope("/admin/reward-items")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, ADMIN_ONLY).await
            }))
            .route("", web::get().to(list_items_handler))
            .route("", web::post().to(create_item_handler))
            .route("/{id}", web::patch().to(update_item_handler)),
    );
}
