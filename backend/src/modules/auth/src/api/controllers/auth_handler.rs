use actix_web::cookie::Cookie;
use actix_web::{HttpRequest, HttpResponse, web};
use base::constants;
use base::error::ApiError;
use base::jwt_claims::JwtClaims;
use base::rate_limit::LIMITER;
use serde_json::json;
use std::time::Duration;

use crate::api::dto::auth::{AuthResponseDTO, LoginRequestDTO, RegisterRequestDTO};
use crate::api::dto::user::UserDTO;
use crate::api::utils::phone::{is_valid_phone, normalize_phone};
use crate::api::utils::pin::{hash_pin, is_valid_pin_format};
use crate::domain::errors::user_errors::UserError;
use crate::domain::models::user::User;
use crate::domain::services::refresh_token::RefreshTokenService;
use crate::domain::models::user::CreateUser;
use crate::domain::services::user::UserService;

const LOGIN_MAX_FAILURES: u32 = 8;
const LOGIN_IP_MAX_FAILURES: u32 = 40;
const LOGIN_WINDOW: Duration = Duration::from_secs(15 * 60);
const REGISTER_MAX_PER_IP: u32 = 30;
const REGISTER_WINDOW: Duration = Duration::from_secs(60 * 60);

/// Serialises the refresh cookie as a `Set-Cookie` value, adding `Partitioned` when configured.
fn set_cookie_header(cookie: &Cookie<'static>) -> (&'static str, String) {
    let mut value = cookie.to_string();
    if *constants::COOKIE_PARTITIONED {
        value.push_str("; Partitioned");
    }
    ("Set-Cookie", value)
}

fn client_ip(req: &HttpRequest) -> String {
    req.connection_info().realip_remote_addr().unwrap_or("unknown").to_string()
}

fn validate_names(first_name: &str, last_name: Option<&str>) -> Result<(), ApiError> {
    if first_name.trim().is_empty() || first_name.chars().count() > 80 {
        return Err(ApiError::new("First name must be 1 to 80 characters", 400));
    }
    if last_name.is_some_and(|name| name.chars().count() > 80) {
        return Err(ApiError::new("Last name must be at most 80 characters", 400));
    }
    Ok(())
}

async fn issue_session(
    refresh_token_service: &dyn RefreshTokenService,
    user: User,
) -> Result<HttpResponse, ApiError> {
    let (raw_refresh_token, session_id) = refresh_token_service
        .create_new_user_refresh_token(user.id)
        .await
        .map_err(ApiError::from)?;
    let access_token = refresh_token_service
        .create_access_token(user.id, user.role.clone(), Some(session_id))
        .map_err(ApiError::from)?;
    let cookie =
        refresh_token_service.build_refresh_token_cookie(raw_refresh_token);

    let body = AuthResponseDTO { access_token, user: UserDTO::from(user) };
    Ok(HttpResponse::Ok().append_header(set_cookie_header(&cookie)).json(json!({
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
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let body = body.into_inner();
    LIMITER.hit(&format!("register:{}", client_ip(&req)), REGISTER_MAX_PER_IP, REGISTER_WINDOW)?;
    validate_names(&body.first_name, body.last_name.as_deref())?;
    if !is_valid_phone(&body.phone) {
        return Err(ApiError::from(UserError::InvalidPhoneFormat));
    }

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
                phone: normalize_phone(&body.phone),
                membership_tier: "Member".to_string(),
                membership_code: String::new(),
                referral_code: String::new(),
                hr_code: None,
                date_of_birth: body.date_of_birth,
            },
            body.referred_by_code
                .map(|code| code.trim().to_uppercase())
                .filter(|code| !code.is_empty()),
        )
        .await
        .map_err(ApiError::from)?;

    issue_session(refresh_token_service.get_ref(), user).await
}

pub async fn login_handler(
    user_service: web::Data<dyn UserService>,
    refresh_token_service: web::Data<dyn RefreshTokenService>,
    body: web::Json<LoginRequestDTO>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let phone = normalize_phone(&body.phone);
    // A 4-digit PIN has only 10,000 values, so failed sign-ins are throttled per
    // phone number (stops guessing one account) and per address (stops spraying).
    let phone_key = format!("login:{phone}");
    let ip_key = format!("login-ip:{}", client_ip(&req));
    LIMITER.check(&phone_key, LOGIN_MAX_FAILURES, LOGIN_WINDOW)?;
    LIMITER.check(&ip_key, LOGIN_IP_MAX_FAILURES, LOGIN_WINDOW)?;

    let user = match user_service.authenticate(&phone, &body.pin).await {
        Ok(user) => user,
        Err(err) => {
            if matches!(err, UserError::InvalidCredentials) {
                LIMITER.record(&phone_key, LOGIN_WINDOW);
                LIMITER.record(&ip_key, LOGIN_WINDOW);
            }
            return Err(ApiError::from(err));
        }
    };
    LIMITER.clear(&phone_key);

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

    let renewed = refresh_token_service
        .renew_refresh_token(raw_token)
        .await
        .map_err(ApiError::from)?;

    let user = user_service.get(renewed.user_id).await.map_err(ApiError::from)?;
    let access_token = refresh_token_service
        .create_access_token(user.id, user.role.clone(), Some(renewed.family_id))
        .map_err(ApiError::from)?;

    let body = AuthResponseDTO { access_token, user: UserDTO::from(user) };
    let mut response = HttpResponse::Ok();
    // No new cookie for a duplicate request: the browser already holds the one the first request set.
    if let Some(new_raw_token) = renewed.new_raw_token {
        response.append_header(set_cookie_header(
            &refresh_token_service.build_refresh_token_cookie(new_raw_token),
        ));
    }
    Ok(response.json(json!({
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
    Ok(HttpResponse::NoContent().append_header(set_cookie_header(&expired_cookie)).finish())
}

pub async fn get_me_handler(
    user_service: web::Data<dyn UserService>,
    claims: JwtClaims,
) -> Result<base::error::ApiResponse<UserDTO>, ApiError> {
    let user = user_service.get(claims.sub).await.map_err(ApiError::from)?;
    Ok(base::error::ApiResponse(user.into()))
}
