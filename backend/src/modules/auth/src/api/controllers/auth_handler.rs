use actix_web::{HttpRequest, HttpResponse, web};
use base::error::ApiError;
use base::jwt_claims::JwtClaims;
use serde_json::json;

use crate::api::dto::auth::{AuthResponseDTO, LoginRequestDTO, RegisterRequestDTO};
use crate::api::dto::user::UserDTO;
use crate::api::utils::pin::{hash_pin, is_valid_pin_format};
use crate::domain::errors::user_errors::UserError;
use crate::domain::models::user::User;
use crate::domain::services::refresh_token::RefreshTokenService;
use crate::domain::models::user::CreateUser;
use crate::domain::services::user::UserService;

async fn issue_session(
    refresh_token_service: &dyn RefreshTokenService,
    user: User,
) -> Result<HttpResponse, ApiError> {
    let access_token = refresh_token_service
        .create_access_token(user.id, user.role.clone())
        .map_err(ApiError::from)?;
    let raw_refresh_token = refresh_token_service
        .create_new_user_refresh_token(user.id)
        .await
        .map_err(ApiError::from)?;
    let cookie =
        refresh_token_service.build_refresh_token_cookie(raw_refresh_token);

    let body = AuthResponseDTO { access_token, user: UserDTO::from(user) };
    Ok(HttpResponse::Ok().cookie(cookie).json(json!({
        "data": body,
        "msg": "",
        "success": true,
        "statusCode": 200
    })))
}

pub async fn register_handler(
    user_service: web::Data<dyn UserService>,
    refresh_token_service: web::Data<dyn RefreshTokenService>,
    body: web::Json<RegisterRequestDTO>,
) -> Result<HttpResponse, ApiError> {
    let body = body.into_inner();

    if !is_valid_pin_format(&body.pin) {
        return Err(ApiError::from(UserError::InvalidPinFormat));
    }

    let user = user_service
        .register(
            CreateUser {
                email: body.email.map(|e| e.trim().to_lowercase()),
                pin_hash: hash_pin(&body.pin),
                first_name: body.first_name,
                last_name: body.last_name,
                phone: body.phone.trim().to_string(),
                membership_tier: "Bronze".to_string(),
                membership_code: String::new(),
                referral_code: String::new(),
                hr_code: None,
                date_of_birth: body.date_of_birth,
            },
            body.referred_by_code,
        )
        .await
        .map_err(ApiError::from)?;

    issue_session(refresh_token_service.get_ref(), user).await
}

pub async fn login_handler(
    user_service: web::Data<dyn UserService>,
    refresh_token_service: web::Data<dyn RefreshTokenService>,
    body: web::Json<LoginRequestDTO>,
) -> Result<HttpResponse, ApiError> {
    let user = user_service
        .authenticate(body.phone.trim(), &body.pin)
        .await
        .map_err(ApiError::from)?;

    issue_session(refresh_token_service.get_ref(), user).await
}

pub async fn refresh_token_handler(
    user_service: web::Data<dyn UserService>,
    refresh_token_service: web::Data<dyn RefreshTokenService>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let raw_token = refresh_token_service
        .extract_refresh_token(&req)
        .map_err(ApiError::from)?;

    let (new_raw_token, user_id) = refresh_token_service
        .renew_refresh_token(raw_token)
        .await
        .map_err(ApiError::from)?;

    let user = user_service.get(user_id).await.map_err(ApiError::from)?;
    let access_token = refresh_token_service
        .create_access_token(user.id, user.role.clone())
        .map_err(ApiError::from)?;
    let cookie =
        refresh_token_service.build_refresh_token_cookie(new_raw_token);

    let body = AuthResponseDTO { access_token, user: UserDTO::from(user) };
    Ok(HttpResponse::Ok().cookie(cookie).json(json!({
        "data": body,
        "msg": "",
        "success": true,
        "statusCode": 200
    })))
}

pub async fn logout_handler(
    refresh_token_service: web::Data<dyn RefreshTokenService>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    if let Ok(raw_token) = refresh_token_service.extract_refresh_token(&req) {
        let _ = refresh_token_service.revoke_refresh_token(raw_token).await;
    }

    let expired_cookie =
        refresh_token_service.build_expired_refresh_token_cookie();
    Ok(HttpResponse::NoContent().cookie(expired_cookie).finish())
}

pub async fn get_me_handler(
    user_service: web::Data<dyn UserService>,
    claims: JwtClaims,
) -> Result<base::error::ApiResponse<UserDTO>, ApiError> {
    let user = user_service.get(claims.sub).await.map_err(ApiError::from)?;
    Ok(base::error::ApiResponse(user.into()))
}
