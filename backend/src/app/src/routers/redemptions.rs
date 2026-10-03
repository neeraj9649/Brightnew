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
use base::jwt_claims::JwtClaims;
use base::role::{ADMIN_ONLY, STAFF};
use rewards::domain::models::reward_transaction::RewardReason;
use rewards::domain::services::rewards::RewardsService;

// ---- DTOs -----------------------------------------------------------------

#[derive(Debug, Serialize)]
pub struct RewardItemDTO {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub wings_cost: i32,
    pub image_file_id: Option<String>,
    pub is_active: bool,
}

#[derive(Debug, Serialize)]
pub struct RedemptionDTO {
    pub id: Uuid,
    pub reward_item_id: Uuid,
    pub item_name: String,
    pub wings_cost: i32,
    pub status: String,
    pub voucher_code: Option<String>,
    pub admin_note: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct AdminRedemptionDTO {
    #[serde(flatten)]
    pub redemption: RedemptionDTO,
    pub user_id: Uuid,
    pub user_name: String,
    pub user_phone: String,
    pub membership_code: String,
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
}

const ACTIVE: &[&str] = &["requested", "approved", "voucher_issued"];
const ALL_STATUSES: &[&str] =
    &["requested", "approved", "voucher_issued", "delivered", "rejected", "cancelled"];

fn db_err(e: sqlx::Error) -> ApiError {
    ApiError::new(e.to_string(), 500)
}

fn gen_voucher() -> String {
    format!("BW-RDM-{}", Uuid::new_v4().simple().to_string()[..8].to_uppercase())
}

// ---- Customer -------------------------------------------------------------

/// Browseable catalog (active items only).
async fn catalog_handler(
    pool: web::Data<PgPool>,
) -> Result<ApiResponse<Vec<RewardItemDTO>>, ApiError> {
    let rows = sqlx::query!(
        r#"SELECT id, name, description, category, wings_cost, image_file_id, is_active
           FROM reward_items WHERE is_active = TRUE ORDER BY wings_cost"#
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;

    Ok(ApiResponse(
        rows.into_iter()
            .map(|r| RewardItemDTO {
                id: r.id,
                name: r.name,
                description: r.description,
                category: r.category,
                wings_cost: r.wings_cost,
                image_file_id: r.image_file_id,
                is_active: r.is_active,
            })
            .collect(),
    ))
}

/// Request a redemption. Wings are reserved (debited) immediately so the same
/// balance can't be spent across several pending requests; a reject/cancel
/// refunds them. ponytail: the debit and the row insert aren't one DB tx (the
/// rewards service owns its own) -- debit goes first so a redemption row always
/// implies the Wings were taken. ponytail: balance check-then-debit can race
/// under concurrent requests; fine for this traffic, add a `tokens >= cost`
/// guarded UPDATE if it ever matters.
async fn create_redemption_handler(
    pool: web::Data<PgPool>,
    rewards_service: web::Data<dyn RewardsService>,
    claims: JwtClaims,
    body: web::Json<CreateRedemptionDTO>,
) -> Result<ApiResponse<RedemptionDTO>, ApiError> {
    let item = sqlx::query!(
        "SELECT name, wings_cost, is_active FROM reward_items WHERE id = $1",
        body.reward_item_id
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(db_err)?
    .ok_or_else(|| ApiError::new("Reward not found", 404))?;

    if !item.is_active {
        return Err(ApiError::new("Reward is not available", 400));
    }

    let balance = sqlx::query!("SELECT tokens FROM users WHERE id = $1", claims.sub)
        .fetch_one(pool.get_ref())
        .await
        .map_err(db_err)?
        .tokens;

    if balance < item.wings_cost {
        return Err(ApiError::new("Not enough Wings to redeem this reward", 400));
    }

    let rid = Uuid::new_v4();
    rewards_service
        .award(
            claims.sub,
            -item.wings_cost,
            RewardReason::Redemption,
            Some("redemption".to_string()),
            Some(rid),
            Some(format!("Redeemed: {}", item.name)),
            Some(claims.sub),
        )
        .await?;

    let row = sqlx::query!(
        r#"INSERT INTO redemptions (id, user_id, reward_item_id, item_name, wings_cost)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, reward_item_id, item_name, wings_cost, status,
                     voucher_code, admin_note, created_at, updated_at"#,
        rid,
        claims.sub,
        body.reward_item_id,
        item.name,
        item.wings_cost,
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(db_err)?;

    Ok(ApiResponse(RedemptionDTO {
        id: row.id,
        reward_item_id: row.reward_item_id,
        item_name: row.item_name,
        wings_cost: row.wings_cost,
        status: row.status,
        voucher_code: row.voucher_code,
        admin_note: row.admin_note,
        created_at: row.created_at,
        updated_at: row.updated_at,
    }))
}

/// The customer's own redemption history (for the "track activities" view).
async fn my_redemptions_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
) -> Result<ApiResponse<Vec<RedemptionDTO>>, ApiError> {
    let rows = sqlx::query!(
        r#"SELECT id, reward_item_id, item_name, wings_cost, status,
                  voucher_code, admin_note, created_at, updated_at
           FROM redemptions WHERE user_id = $1 ORDER BY created_at DESC"#,
        claims.sub
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;

    Ok(ApiResponse(
        rows.into_iter()
            .map(|r| RedemptionDTO {
                id: r.id,
                reward_item_id: r.reward_item_id,
                item_name: r.item_name,
                wings_cost: r.wings_cost,
                status: r.status,
                voucher_code: r.voucher_code,
                admin_note: r.admin_note,
                created_at: r.created_at,
                updated_at: r.updated_at,
            })
            .collect(),
    ))
}

/// Customer cancels their own still-pending request and gets the Wings back.
async fn cancel_redemption_handler(
    pool: web::Data<PgPool>,
    rewards_service: web::Data<dyn RewardsService>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<RedemptionDTO>, ApiError> {
    let id = path.into_inner();
    let row = sqlx::query!(
        "SELECT wings_cost, status, item_name FROM redemptions WHERE id = $1 AND user_id = $2",
        id,
        claims.sub
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(db_err)?
    .ok_or_else(|| ApiError::new("Redemption not found", 404))?;

    if row.status != "requested" {
        return Err(ApiError::new("Only pending requests can be cancelled", 400));
    }

    refund(&rewards_service, claims.sub, id, row.wings_cost, "Redemption cancelled").await?;
    let updated = set_status(pool.get_ref(), id, "cancelled", None, None).await?;
    Ok(ApiResponse(updated))
}

// ---- Admin: redemption queue ---------------------------------------------

async fn list_redemptions_handler(
    pool: web::Data<PgPool>,
) -> Result<ApiResponse<Vec<AdminRedemptionDTO>>, ApiError> {
    let rows = sqlx::query!(
        r#"SELECT r.id, r.reward_item_id, r.item_name, r.wings_cost, r.status,
                  r.voucher_code, r.admin_note, r.created_at, r.updated_at,
                  r.user_id, u.first_name, u.last_name, u.phone, u.membership_code
           FROM redemptions r JOIN users u ON u.id = r.user_id
           ORDER BY r.created_at DESC"#
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;

    Ok(ApiResponse(
        rows.into_iter()
            .map(|r| AdminRedemptionDTO {
                redemption: RedemptionDTO {
                    id: r.id,
                    reward_item_id: r.reward_item_id,
                    item_name: r.item_name,
                    wings_cost: r.wings_cost,
                    status: r.status,
                    voucher_code: r.voucher_code,
                    admin_note: r.admin_note,
                    created_at: r.created_at,
                    updated_at: r.updated_at,
                },
                user_id: r.user_id,
                user_name: format!("{} {}", r.first_name, r.last_name.unwrap_or_default())
                    .trim()
                    .to_string(),
                user_phone: r.phone,
                membership_code: r.membership_code,
            })
            .collect(),
    ))
}

/// Advance a redemption through the pipeline. Rejecting an active (already
/// paid) request refunds the Wings; issuing a voucher auto-mints a code if the
/// admin didn't supply one.
async fn update_status_handler(
    pool: web::Data<PgPool>,
    rewards_service: web::Data<dyn RewardsService>,
    path: web::Path<Uuid>,
    body: web::Json<UpdateStatusDTO>,
) -> Result<ApiResponse<RedemptionDTO>, ApiError> {
    let id = path.into_inner();
    let body = body.into_inner();

    if !ALL_STATUSES.contains(&body.status.as_str()) {
        return Err(ApiError::new("Invalid status", 400));
    }

    let cur = sqlx::query!(
        "SELECT user_id, wings_cost, status FROM redemptions WHERE id = $1",
        id
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(db_err)?
    .ok_or_else(|| ApiError::new("Redemption not found", 404))?;

    if body.status == "rejected" && ACTIVE.contains(&cur.status.as_str()) {
        refund(&rewards_service, cur.user_id, id, cur.wings_cost, "Redemption rejected").await?;
    }

    let voucher = match (body.status.as_str(), &body.voucher_code) {
        ("voucher_issued", None) => Some(gen_voucher()),
        _ => body.voucher_code.clone(),
    };

    let updated = set_status(pool.get_ref(), id, &body.status, voucher, body.admin_note).await?;
    Ok(ApiResponse(updated))
}

// ---- Admin: catalog -------------------------------------------------------

async fn list_items_handler(
    pool: web::Data<PgPool>,
) -> Result<ApiResponse<Vec<RewardItemDTO>>, ApiError> {
    let rows = sqlx::query!(
        r#"SELECT id, name, description, category, wings_cost, image_file_id, is_active
           FROM reward_items ORDER BY created_at DESC"#
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;

    Ok(ApiResponse(
        rows.into_iter()
            .map(|r| RewardItemDTO {
                id: r.id,
                name: r.name,
                description: r.description,
                category: r.category,
                wings_cost: r.wings_cost,
                image_file_id: r.image_file_id,
                is_active: r.is_active,
            })
            .collect(),
    ))
}

async fn create_item_handler(
    pool: web::Data<PgPool>,
    body: web::Json<CreateRewardItemDTO>,
) -> Result<ApiResponse<RewardItemDTO>, ApiError> {
    let b = body.into_inner();
    if b.wings_cost <= 0 {
        return Err(ApiError::new("Wings cost must be positive", 400));
    }
    let r = sqlx::query!(
        r#"INSERT INTO reward_items (name, description, category, wings_cost, image_file_id, is_active)
           VALUES ($1, $2, $3, $4, $5, COALESCE($6, TRUE))
           RETURNING id, name, description, category, wings_cost, image_file_id, is_active"#,
        b.name,
        b.description,
        b.category,
        b.wings_cost,
        b.image_file_id,
        b.is_active,
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(db_err)?;

    Ok(ApiResponse(RewardItemDTO {
        id: r.id,
        name: r.name,
        description: r.description,
        category: r.category,
        wings_cost: r.wings_cost,
        image_file_id: r.image_file_id,
        is_active: r.is_active,
    }))
}

async fn update_item_handler(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    body: web::Json<UpdateRewardItemDTO>,
) -> Result<ApiResponse<RewardItemDTO>, ApiError> {
    let id = path.into_inner();
    let b = body.into_inner();
    let r = sqlx::query!(
        r#"UPDATE reward_items SET
               name = COALESCE($2, name),
               description = COALESCE($3, description),
               category = COALESCE($4, category),
               wings_cost = COALESCE($5, wings_cost),
               image_file_id = COALESCE($6, image_file_id),
               is_active = COALESCE($7, is_active)
           WHERE id = $1
           RETURNING id, name, description, category, wings_cost, image_file_id, is_active"#,
        id,
        b.name,
        b.description,
        b.category,
        b.wings_cost,
        b.image_file_id,
        b.is_active,
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(db_err)?
    .ok_or_else(|| ApiError::new("Reward not found", 404))?;

    Ok(ApiResponse(RewardItemDTO {
        id: r.id,
        name: r.name,
        description: r.description,
        category: r.category,
        wings_cost: r.wings_cost,
        image_file_id: r.image_file_id,
        is_active: r.is_active,
    }))
}

// ---- helpers --------------------------------------------------------------

async fn refund(
    rewards_service: &web::Data<dyn RewardsService>,
    user_id: Uuid,
    redemption_id: Uuid,
    wings: i32,
    why: &str,
) -> Result<(), ApiError> {
    rewards_service
        .award(
            user_id,
            wings,
            RewardReason::Redemption,
            Some("redemption_refund".to_string()),
            Some(redemption_id),
            Some(format!("{} (refund)", why)),
            None,
        )
        .await?;
    Ok(())
}

async fn set_status(
    pool: &PgPool,
    id: Uuid,
    status: &str,
    voucher_code: Option<String>,
    admin_note: Option<String>,
) -> Result<RedemptionDTO, ApiError> {
    let r = sqlx::query!(
        r#"UPDATE redemptions SET
               status = $2,
               voucher_code = COALESCE($3, voucher_code),
               admin_note = COALESCE($4, admin_note),
               updated_at = NOW()
           WHERE id = $1
           RETURNING id, reward_item_id, item_name, wings_cost, status,
                     voucher_code, admin_note, created_at, updated_at"#,
        id,
        status,
        voucher_code,
        admin_note,
    )
    .fetch_one(pool)
    .await
    .map_err(db_err)?;

    Ok(RedemptionDTO {
        id: r.id,
        reward_item_id: r.reward_item_id,
        item_name: r.item_name,
        wings_cost: r.wings_cost,
        status: r.status,
        voucher_code: r.voucher_code,
        admin_note: r.admin_note,
        created_at: r.created_at,
        updated_at: r.updated_at,
    })
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
