use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};
use base::error::{ApiError, ApiResponse};
use base::jwt_claims::JwtClaims;
use serde::Serialize;

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

pub fn referral_routes(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/referrals")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, &[]).await
            }))
            .route("/me", web::get().to(my_referral_info_handler)),
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
