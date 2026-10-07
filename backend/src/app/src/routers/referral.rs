use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};
use base::error::{ApiError, ApiResponse};
use base::jwt_claims::JwtClaims;
use chrono::{DateTime, Utc};
use serde::Serialize;
use sqlx::PgPool;
use uuid::Uuid;

use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use auth::domain::services::user::UserService;
use base::role::ADMIN_ONLY;
use referral::api::controllers::referral_handler::admin_run_monthly_payout_handler;
use referral::domain::services::referral::ReferralService;

#[derive(Debug, Serialize)]
pub struct MyReferralInfoDTO {
    pub referral_code: Option<String>,
    pub direct_referrals_count: i64,
}

/// Combines auth (for the user's own referral_code) and referral (for the
/// count) -- lives at the app layer since neither module depends on the
/// other (auth -> referral is a one-way edge for recording at signup only).
async fn my_referral_info_handler(
    user_service: web::Data<dyn UserService>,
    referral_service: web::Data<dyn ReferralService>,
    claims: JwtClaims,
) -> Result<ApiResponse<MyReferralInfoDTO>, ApiError> {
    let user = user_service.get(claims.sub).await?;
    let direct_referrals_count =
        referral_service.direct_referral_count(claims.sub).await?;
    Ok(ApiResponse(MyReferralInfoDTO {
        referral_code: user.referral_code,
        direct_referrals_count,
    }))
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ReferredFriendDTO {
    pub id: Uuid,
    pub name: String,
    pub joined_at: DateTime<Utc>,
    pub first_booking_completed: bool,
    pub first_booking_at: Option<DateTime<Utc>>,
    pub wings_credited: Option<i32>,
    pub credited_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct ReferralActivityDTO {
    pub referral_code: Option<String>,
    pub wings_per_friend: i32,
    pub invited: i64,
    pub completed: i64,
    pub wings_earned: i64,
    pub friends: Vec<ReferredFriendDTO>,
}

/// The member's referred friends and where each one is on the way to the
/// one-time referral reward. Names are shortened to first name + initial.
async fn referral_activity_handler(
    pool: web::Data<PgPool>,
    user_service: web::Data<dyn UserService>,
    claims: JwtClaims,
) -> Result<ApiResponse<ReferralActivityDTO>, ApiError> {
    let user = user_service.get(claims.sub).await?;
    let friends = sqlx::query_as::<_, ReferredFriendDTO>(
        r#"SELECT u.id,
                  CASE WHEN COALESCE(u.last_name, '') = '' THEN u.first_name
                       ELSE u.first_name || ' ' || LEFT(u.last_name, 1) || '.' END AS name,
                  r.created_at AS joined_at,
                  EXISTS(SELECT 1 FROM bookings b WHERE b.user_id = u.id AND b.status = 'completed') AS first_booking_completed,
                  (SELECT MIN(b.updated_at) FROM bookings b WHERE b.user_id = u.id AND b.status = 'completed') AS first_booking_at,
                  t.points AS wings_credited,
                  t.created_at AS credited_at
           FROM referrals r
           JOIN users u ON u.id = r.referred_id
           LEFT JOIN reward_transactions t
                  ON t.user_id = r.referrer_id AND t.reason = 'referral'
                 AND t.source_type = 'referral_first_booking' AND t.source_id = u.id
           WHERE r.referrer_id = $1
           ORDER BY r.created_at DESC"#,
    )
    .bind(claims.sub)
    .fetch_all(pool.get_ref())
    .await?;
    let wings_per_friend: i32 =
        sqlx::query_scalar("SELECT points FROM points_config WHERE key = 'referral_booking'")
            .fetch_optional(pool.get_ref())
            .await?
            .unwrap_or(50);
    Ok(ApiResponse(ReferralActivityDTO {
        referral_code: user.referral_code,
        wings_per_friend,
        invited: friends.len() as i64,
        completed: friends.iter().filter(|f| f.wings_credited.is_some()).count() as i64,
        wings_earned: friends.iter().filter_map(|f| f.wings_credited).map(i64::from).sum(),
        friends,
    }))
}

pub fn referral_routes(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/referrals")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, &[]).await
            }))
            .route("/me", web::get().to(my_referral_info_handler))
            .route("/activity", web::get().to(referral_activity_handler)),
    )
    .service(
        web::scope("/admin/referrals")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, ADMIN_ONLY).await
            }))
            .route(
                "/run-monthly-payout",
                web::post().to(admin_run_monthly_payout_handler),
            ),
    );
}
