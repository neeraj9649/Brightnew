use actix_web::cookie::Cookie;
use actix_web::{HttpRequest, HttpResponse, web};
use base::constants;
use base::error::ApiError;
use base::jwt_claims::JwtClaims;
use base::rate_limit::LIMITER;
use serde_json::json;
use sqlx::PgPool;
use std::time::Duration;

use crate::api::dto::auth::{AuthResponseDTO, LoginRequestDTO, OtpRequestDTO, RegisterRequestDTO, ResetPinRequestDTO};
use crate::api::dto::user::UserDTO;
use crate::api::utils::otp::{self, OtpPurpose, OTP_LENGTH};
use crate::api::utils::phone::{is_valid_phone, normalize_phone};
use crate::api::utils::pin::{hash_pin, is_valid_pin_format, verify_pin};
use crate::domain::errors::user_errors::UserError;
use crate::domain::models::user::User;
use crate::domain::services::refresh_token::RefreshTokenService;
use crate::domain::models::user::{CreateUser, UpdateUser};
use crate::domain::services::user::UserService;

const LOGIN_MAX_FAILURES: u32 = 8;
const LOGIN_IP_MAX_FAILURES: u32 = 40;
const LOGIN_WINDOW: Duration = Duration::from_secs(15 * 60);
const REGISTER_MAX_PER_IP: u32 = 30;
const REGISTER_WINDOW: Duration = Duration::from_secs(60 * 60);
const RESET_MAX_PER_IP: u32 = 30;
// Every code costs an SMS, so sends are capped per number and per address.
const OTP_SENDS_PER_PHONE: u32 = 5;
const OTP_SENDS_PER_IP: u32 = 30;
const OTP_SEND_WINDOW: Duration = Duration::from_secs(60 * 60);

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

/// Sends a 4-digit code for joining ("register") or for resetting a forgotten passcode ("reset").
/// It says whether the number has an account: the member needs to know whether to join or reset,
/// and sending codes to numbers without an account costs money.
pub async fn request_otp_handler(
    user_service: web::Data<dyn UserService>,
    pool: web::Data<PgPool>,
    body: web::Json<OtpRequestDTO>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let body = body.into_inner();
    if !is_valid_phone(&body.phone) {
        return Err(ApiError::from(UserError::InvalidPhoneFormat));
    }
    let phone = normalize_phone(&body.phone);
    let purpose = match body.purpose.as_str() {
        "register" => OtpPurpose::Register,
        // "login" is what the portal sent before passcodes came back.
        "reset" | "login" => OtpPurpose::Reset,
        _ => return Err(ApiError::new("Unknown code purpose", 400)),
    };

    let email = match (purpose, user_service.find_for_sign_in(&phone).await) {
        (OtpPurpose::Reset, Ok(user)) => user.email,
        (OtpPurpose::Reset, Err(UserError::UserDoesNotExist)) => {
            return Err(ApiError::new("No Bright Wings account uses this number. Create your membership instead.", 404));
        }
        (OtpPurpose::Register, Err(UserError::UserDoesNotExist)) => None,
        (OtpPurpose::Register, Ok(_) | Err(UserError::UserNotAuthorised)) => {
            return Err(ApiError::from(UserError::UserAlreadyExists));
        }
        (_, Err(err)) => return Err(ApiError::from(err)),
    };

    // Catch a mistyped referral or staff code before the member waits for an SMS.
    if purpose == OtpPurpose::Register {
        if let Some(code) = body.referred_by_code.map(|c| c.trim().to_uppercase()).filter(|c| !c.is_empty()) {
            let known: bool = sqlx::query_scalar("SELECT EXISTS (SELECT 1 FROM users WHERE referral_code = $1 AND is_active)")
                .bind(&code)
                .fetch_one(pool.get_ref())
                .await
                .map_err(|e| base::error::internal(e))?;
            if !known {
                return Err(ApiError::from(UserError::InvalidReferralCode));
            }
        }
    }

    LIMITER.hit(&format!("otp:{phone}"), OTP_SENDS_PER_PHONE, OTP_SEND_WINDOW)?;
    LIMITER.hit(&format!("otp-ip:{}", client_ip(&req)), OTP_SENDS_PER_IP, OTP_SEND_WINDOW)?;

    let sent = otp::send_code(pool.get_ref(), &phone, purpose, email.as_deref()).await?;
    let mut data = json!({
        "sent": true,
        "channel": sent.channel,
        "code_length": OTP_LENGTH,
        "expires_in_seconds": 600,
        "resend_after_seconds": 60,
    });
    if let Some(code) = sent.dev_code {
        data["dev_code"] = json!(code);
    }
    Ok(HttpResponse::Ok().json(json!({ "data": data, "msg": "", "success": true, "statusCode": 200 })))
}

pub async fn register_handler(
    user_service: web::Data<dyn UserService>,
    refresh_token_service: web::Data<dyn RefreshTokenService>,
    pool: web::Data<PgPool>,
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
    let phone = normalize_phone(&body.phone);

    // The code proves the member owns this number.
    otp::check_code(pool.get_ref(), &phone, OtpPurpose::Register, body.code.trim()).await?;

    let user = user_service
        .register(
            CreateUser {
                email: body.email.map(|e| e.trim().to_lowercase()),
                pin_hash: hash_pin(&body.pin),
                first_name: body.first_name,
                last_name: body.last_name,
                phone,
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
    // A 4-digit passcode has only 10,000 values, so wrong guesses are throttled per phone
    // number and per address.
    let phone_key = format!("login:{phone}");
    let ip_key = format!("login-ip:{}", client_ip(&req));
    LIMITER.check(&phone_key, LOGIN_MAX_FAILURES, LOGIN_WINDOW)?;
    LIMITER.check(&ip_key, LOGIN_IP_MAX_FAILURES, LOGIN_WINDOW)?;

    let user = match user_service.find_for_sign_in(&phone).await {
        Ok(user) => user,
        Err(UserError::UserDoesNotExist) => {
            LIMITER.record(&ip_key, LOGIN_WINDOW);
            return Err(ApiError::new("No Bright Wings account uses this number. Create your membership instead.", 404));
        }
        Err(err) => return Err(ApiError::from(err)),
    };
    if !verify_pin(body.pin.trim(), &user.pin_hash) {
        LIMITER.record(&phone_key, LOGIN_WINDOW);
        LIMITER.record(&ip_key, LOGIN_WINDOW);
        return Err(ApiError::from(UserError::InvalidCredentials));
    }
    LIMITER.clear(&phone_key);

    issue_session(refresh_token_service.get_ref(), user).await
}

/// Forgot passcode: the code (purpose "reset") proves the phone, then the new passcode is saved,
/// every existing session is signed out, and the member is signed in on this device.
pub async fn reset_pin_handler(
    user_service: web::Data<dyn UserService>,
    refresh_token_service: web::Data<dyn RefreshTokenService>,
    pool: web::Data<PgPool>,
    body: web::Json<ResetPinRequestDTO>,
    req: HttpRequest,
) -> Result<HttpResponse, ApiError> {
    let body = body.into_inner();
    LIMITER.hit(&format!("pin-reset:{}", client_ip(&req)), RESET_MAX_PER_IP, REGISTER_WINDOW)?;
    if !is_valid_pin_format(&body.pin) {
        return Err(ApiError::from(UserError::InvalidPinFormat));
    }
    let phone = normalize_phone(&body.phone);
    let user = match user_service.find_for_sign_in(&phone).await {
        Ok(user) => user,
        Err(UserError::UserDoesNotExist) => {
            return Err(ApiError::new("No Bright Wings account uses this number. Create your membership instead.", 404));
        }
        Err(err) => return Err(ApiError::from(err)),
    };

    otp::check_code(pool.get_ref(), &phone, OtpPurpose::Reset, body.code.trim()).await?;

    let user = user_service
        .update(UpdateUser { id: user.id, pin_hash: Some(hash_pin(&body.pin)), ..Default::default() })
        .await
        .map_err(ApiError::from)?;
    // Anyone who knew the old passcode is signed out everywhere.
    sqlx::query("UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1 AND is_revoked = FALSE")
        .bind(user.id)
        .execute(pool.get_ref())
        .await
        .map_err(|e| base::error::internal(e))?;
    LIMITER.clear(&format!("login:{phone}"));

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
