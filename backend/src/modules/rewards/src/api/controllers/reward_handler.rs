use actix_web::web;
use base::error::{ApiError, ApiResponse};
use base::jwt_claims::JwtClaims;
use sqlx::PgPool;
use uuid::Uuid;

use crate::api::dto::reward::{
    AdminAwardPointsDTO, PointsConfigDTO, RewardTransactionDTO, ServicePointsDTO,
};
use crate::domain::models::reward_transaction::RewardReason;
use crate::domain::points_config::{read_config, write_config, PointsConfig};
use crate::domain::services::rewards::RewardsService;

impl From<PointsConfig> for PointsConfigDTO {
    fn from(cfg: PointsConfig) -> Self {
        PointsConfigDTO {
            welcome_bonus: cfg.welcome_bonus,
            first_booking: cfg.first_booking,
            referral_booking: cfg.referral_booking,
            services: cfg
                .services
                .into_iter()
                .map(|(booking_type, points)| ServicePointsDTO {
                    booking_type,
                    points,
                })
                .collect(),
        }
    }
}
/// Read-only: the configured per-service token amounts. Drives the customer
/// dashboard's "tokens you earn per service" list. Any authenticated user.
pub async fn points_config_handler(
    pool: web::Data<PgPool>,
) -> Result<ApiResponse<PointsConfigDTO>, ApiError> {
    Ok(ApiResponse(read_config(pool.get_ref()).await.into()))
}

/// Admin-only: set how many Wings each service awards, plus the welcome and
/// first-booking bonuses. Returns the freshly-stored config.
pub async fn update_points_config_handler(
    pool: web::Data<PgPool>,
    body: web::Json<PointsConfigDTO>,
) -> Result<ApiResponse<PointsConfigDTO>, ApiError> {
    let body = body.into_inner();
    if body.welcome_bonus < 0
        || body.first_booking < 0
        || body.referral_booking < 0
        || body.services.iter().any(|s| s.points < 0)
    {
        return Err(ApiError::new("Point amounts cannot be negative", 400));
    }
    let services: Vec<(String, i32)> = body
        .services
        .into_iter()
        .map(|s| (s.booking_type, s.points))
        .collect();
    write_config(
        pool.get_ref(),
        body.welcome_bonus,
        body.first_booking,
        body.referral_booking,
        &services,
    )
    .await?;
    Ok(ApiResponse(read_config(pool.get_ref()).await.into()))
}

pub async fn my_reward_history_handler(
    rewards_service: web::Data<dyn RewardsService>,
    claims: JwtClaims,
) -> Result<ApiResponse<Vec<RewardTransactionDTO>>, ApiError> {
    let history = rewards_service.history(claims.sub).await?;
    Ok(ApiResponse(history.into_iter().map(Into::into).collect()))
}

/// Staff-only: the Wings ledger of a specific customer (for the admin user
/// detail page).
pub async fn admin_user_reward_history_handler(
    rewards_service: web::Data<dyn RewardsService>,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<Vec<RewardTransactionDTO>>, ApiError> {
    let history = rewards_service.history(path.into_inner()).await?;
    Ok(ApiResponse(history.into_iter().map(Into::into).collect()))
}

/// Manual award path for cases with no automatic trigger yet (e.g. office
/// visits) -- ahead of the full employee CRM workspace.
pub async fn admin_award_points_handler(
    rewards_service: web::Data<dyn RewardsService>,
    claims: JwtClaims,
    body: web::Json<AdminAwardPointsDTO>,
) -> Result<ApiResponse<RewardTransactionDTO>, ApiError> {
    let body = body.into_inner();
    let transaction = rewards_service
        .award(
            body.user_id,
            body.points,
            RewardReason::Manual,
            None,
            None,
            body.description,
            Some(claims.sub),
        )
        .await?;
    Ok(ApiResponse(transaction.into()))
}
