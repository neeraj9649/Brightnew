use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};
use chrono::{DateTime, NaiveDate, Utc};
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;

use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use base::error::{ApiError, ApiResponse};
use base::jwt_claims::JwtClaims;
use referral::domain::services::referral::ReferralService;
use referral::domain::rate_config::referral_rate_percent;
use rewards::domain::models::reward_transaction::RewardTransaction;
use rewards::domain::services::rewards::RewardsService;
use rewards::domain::tier_config::tier_for_lifetime_points;

#[derive(Debug, Serialize)]
pub struct LoyaltyMemberDTO {
    pub name: String,
    pub phone: String,
    pub membership_code: String,
    pub referral_code: Option<String>,
    pub joined_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct TierProgressDTO {
    pub current: String,
    pub lifetime_wings: i64,
    pub next_tier: Option<String>,
    pub next_threshold: Option<i64>,
    pub progress_percent: i32,
}

#[derive(Debug, Serialize)]
pub struct LoyaltyCardDTO {
    pub membership_code: String,
    pub name: String,
    pub membership_tier: String,
    pub member_since: DateTime<Utc>,
    pub valid_until: NaiveDate,
    pub verification_path: String,
}

#[derive(Debug, Serialize)]
pub struct LoyaltyLedgerEntryDTO {
    pub id: Uuid,
    pub points: i32,
    pub reason: String,
    pub source_type: Option<String>,
    pub source_id: Option<Uuid>,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct LoyaltyCatalogItemDTO {
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub category: Option<String>,
    pub wings_cost: i32,
    pub image_file_id: Option<String>,
    pub is_active: bool,
}

#[derive(Debug, Serialize)]
pub struct LoyaltyRedemptionDTO {
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
pub struct ReferralStatusDTO {
    pub code: Option<String>,
    pub direct_referrals: i64,
    pub monthly_rate_percent: f64,
    pub milestone: String,
}

#[derive(Debug, Serialize)]
pub struct LoyaltySummaryDTO {
    pub balance: i32,
    pub member: LoyaltyMemberDTO,
    pub tier: TierProgressDTO,
    pub card: LoyaltyCardDTO,
    pub ledger: Vec<LoyaltyLedgerEntryDTO>,
    pub referral: ReferralStatusDTO,
    pub catalog: Vec<LoyaltyCatalogItemDTO>,
    pub redemptions: Vec<LoyaltyRedemptionDTO>,
}

struct MemberRow {
    name: String,
    phone: String,
    membership_code: String,
    membership_tier: String,
    referral_code: Option<String>,
    tokens: i32,
    lifetime_points_earned: i64,
    joined_at: DateTime<Utc>,
}

async fn member(pool: &PgPool, user_id: Uuid) -> Result<MemberRow, ApiError> {
    let row = sqlx::query!(
        r#"SELECT first_name, last_name, phone, membership_code,
                  membership_tier, referral_code, tokens,
                  lifetime_points_earned, joined_at
           FROM users WHERE id = $1"#,
        user_id
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| ApiError::new(e.to_string(), 500))?
    .ok_or_else(|| ApiError::new("Member not found", 404))?;

    Ok(MemberRow {
        name: format!("{} {}", row.first_name, row.last_name.unwrap_or_default())
            .trim()
            .to_string(),
        phone: row.phone,
        membership_code: row.membership_code,
        membership_tier: row.membership_tier,
        referral_code: row.referral_code,
        tokens: row.tokens,
        lifetime_points_earned: row.lifetime_points_earned,
        joined_at: row.joined_at,
    })
}

fn card_from(member: &MemberRow) -> LoyaltyCardDTO {
    LoyaltyCardDTO {
        membership_code: member.membership_code.clone(),
        name: member.name.clone(),
        membership_tier: member.membership_tier.clone(),
        member_since: member.joined_at,
        valid_until: super::cards::card_valid_until(),
        verification_path: format!("/cards/{}", member.membership_code),
    }
}

fn tier_progress(member: &MemberRow) -> TierProgressDTO {
    let current = tier_for_lifetime_points(member.lifetime_points_earned).to_string();
    let (next_tier, next_threshold, floor) = match current.as_str() {
        "Silver" => (Some("Gold".to_string()), Some(1_000), 0),
        "Gold" => (Some("Platinum".to_string()), Some(5_000), 1_000),
        "Platinum" => (Some("Titanium".to_string()), Some(20_000), 5_000),
        _ => (None, None, 20_000),
    };
    let progress_percent = next_threshold
        .map(|threshold| {
            (((member.lifetime_points_earned - floor).max(0) as f64 / (threshold - floor) as f64)
                * 100.0)
                .round()
                .clamp(0.0, 100.0) as i32
        })
        .unwrap_or(100);

    TierProgressDTO {
        current,
        lifetime_wings: member.lifetime_points_earned,
        next_tier,
        next_threshold,
        progress_percent,
    }
}

fn ledger_entry(transaction: RewardTransaction) -> LoyaltyLedgerEntryDTO {
    LoyaltyLedgerEntryDTO {
        id: transaction.id,
        points: transaction.points,
        reason: transaction.reason,
        source_type: transaction.source_type,
        source_id: transaction.source_id,
        description: transaction.description,
        created_at: transaction.created_at,
    }
}

async fn catalog(pool: &PgPool) -> Result<Vec<LoyaltyCatalogItemDTO>, ApiError> {
    let rows = sqlx::query!(
        r#"SELECT id, name, description, category, wings_cost, image_file_id, is_active
           FROM reward_items WHERE is_active = TRUE ORDER BY wings_cost"#
    )
    .fetch_all(pool)
    .await
    .map_err(|e| ApiError::new(e.to_string(), 500))?;

    Ok(rows
        .into_iter()
        .map(|row| LoyaltyCatalogItemDTO {
            id: row.id,
            name: row.name,
            description: row.description,
            category: row.category,
            wings_cost: row.wings_cost,
            image_file_id: row.image_file_id,
            is_active: row.is_active,
        })
        .collect())
}

async fn redemptions(pool: &PgPool, user_id: Uuid) -> Result<Vec<LoyaltyRedemptionDTO>, ApiError> {
    let rows = sqlx::query!(
        r#"SELECT id, reward_item_id, item_name, wings_cost, status,
                  voucher_code, admin_note, created_at, updated_at
           FROM redemptions WHERE user_id = $1 ORDER BY created_at DESC"#,
        user_id
    )
    .fetch_all(pool)
    .await
    .map_err(|e| ApiError::new(e.to_string(), 500))?;

    Ok(rows
        .into_iter()
        .map(|row| LoyaltyRedemptionDTO {
            id: row.id,
            reward_item_id: row.reward_item_id,
            item_name: row.item_name,
            wings_cost: row.wings_cost,
            status: row.status,
            voucher_code: row.voucher_code,
            admin_note: row.admin_note,
            created_at: row.created_at,
            updated_at: row.updated_at,
        })
        .collect())
}

async fn summary_handler(
    pool: web::Data<PgPool>,
    rewards_service: web::Data<dyn RewardsService>,
    referral_service: web::Data<dyn ReferralService>,
    claims: JwtClaims,
) -> Result<ApiResponse<LoyaltySummaryDTO>, ApiError> {
    let member = member(pool.get_ref(), claims.sub).await?;
    let referral_count = referral_service.direct_referral_count(claims.sub).await?;
    let ledger = rewards_service
        .history(claims.sub)
        .await?
        .into_iter()
        .map(ledger_entry)
        .collect();
    let referral = ReferralStatusDTO {
        code: member.referral_code.clone(),
        direct_referrals: referral_count,
        monthly_rate_percent: referral_rate_percent(),
        milestone: "Joined → first booking completed → Wings credited once per friend".to_string(),
    };

    Ok(ApiResponse(LoyaltySummaryDTO {
        balance: member.tokens,
        member: LoyaltyMemberDTO {
            name: member.name.clone(),
            phone: member.phone.clone(),
            membership_code: member.membership_code.clone(),
            referral_code: member.referral_code.clone(),
            joined_at: member.joined_at,
        },
        tier: tier_progress(&member),
        card: card_from(&member),
        ledger,
        referral,
        catalog: catalog(pool.get_ref()).await?,
        redemptions: redemptions(pool.get_ref(), claims.sub).await?,
    }))
}

async fn ledger_handler(
    rewards_service: web::Data<dyn RewardsService>,
    claims: JwtClaims,
) -> Result<ApiResponse<Vec<LoyaltyLedgerEntryDTO>>, ApiError> {
    Ok(ApiResponse(
        rewards_service
            .history(claims.sub)
            .await?
            .into_iter()
            .map(ledger_entry)
            .collect(),
    ))
}

async fn card_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
) -> Result<ApiResponse<LoyaltyCardDTO>, ApiError> {
    Ok(ApiResponse(card_from(
        &member(pool.get_ref(), claims.sub).await?,
    )))
}

pub fn loyalty_routes(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/loyalty")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, &[]).await
            }))
            .route("/summary", web::get().to(summary_handler))
            .route("/ledger", web::get().to(ledger_handler))
            .route("/card", web::get().to(card_handler)),
    );
}
