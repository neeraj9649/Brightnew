use actix_web::web;
use rand::Rng;
use base::error::{ApiError, ApiResponse};
use base::jwt_claims::JwtClaims;
use base::result_paging::ResultPaging;

use crate::api::dto::user::{
    AdminCreateUserDTO, AdminUpdateUserDTO, ChangePinDTO, UpdateProfileDTO, UserDTO,
};
use crate::api::utils::pin::{hash_pin, is_valid_pin_format};
use crate::api::utils::phone::{is_valid_phone, normalize_phone};
use crate::domain::errors::user_errors::UserError;
use crate::domain::models::user::{CreateUser, UpdateUser};
use crate::domain::services::user::UserService;

pub async fn get_me_profile_handler(
    user_service: web::Data<dyn UserService>,
    claims: JwtClaims,
) -> Result<ApiResponse<UserDTO>, ApiError> {
    let user = user_service.get(claims.sub).await?;
    Ok(ApiResponse(user.into()))
}

pub async fn update_me_profile_handler(
    user_service: web::Data<dyn UserService>,
    claims: JwtClaims,
    body: web::Json<UpdateProfileDTO>,
) -> Result<ApiResponse<UserDTO>, ApiError> {
    let body = body.into_inner();
    if body.phone.as_deref().is_some_and(|phone| !is_valid_phone(phone)) {
        return Err(ApiError::from(UserError::InvalidPhoneFormat));
    }
    let user = user_service
        .update(UpdateUser {
            id: claims.sub,
            first_name: body.first_name,
            last_name: body.last_name,
            phone: body.phone.map(|phone| normalize_phone(&phone)),
            profile_image_file_id: body.profile_image_file_id,
            ..Default::default()
        })
        .await?;
    Ok(ApiResponse(user.into()))
}

pub async fn list_users_handler(
    user_service: web::Data<dyn UserService>,
) -> Result<ApiResponse<ResultPaging<UserDTO>>, ApiError> {
    let users = user_service.list().await?;
    Ok(ApiResponse(users.map(|item| item.into())))
}

/// Staff (employee/admin): fetch a single customer by id. Lets employees open
/// the user-detail page without loading the whole admin user list.
pub async fn staff_get_user_handler(
    user_service: web::Data<dyn UserService>,
    path: web::Path<uuid::Uuid>,
) -> Result<ApiResponse<UserDTO>, ApiError> {
    let user = user_service.get(path.into_inner()).await?;
    Ok(ApiResponse(user.into()))
}

pub async fn admin_update_user_handler(
    user_service: web::Data<dyn UserService>,
    body: web::Json<AdminUpdateUserDTO>,
) -> Result<ApiResponse<UserDTO>, ApiError> {
    let body = body.into_inner();
    if body.phone.as_deref().is_some_and(|phone| !is_valid_phone(phone)) {
        return Err(ApiError::from(UserError::InvalidPhoneFormat));
    }
    if body.role.as_deref().is_some_and(|role| {
        !matches!(role, "customer" | "employee" | "admin")
    }) {
        return Err(ApiError::new("Invalid user role", 400));
    }
    let membership_tier = body.membership_tier.map(|tier| match tier.as_str() {
        // Bronze was used by the legacy portal; Silver is the v2 entry tier.
        "Bronze" | "bronze" => "Silver".to_string(),
        "gold" => "Gold".to_string(),
        "platinum" => "Platinum".to_string(),
        "titanium" => "Titanium".to_string(),
        _ => tier,
    });
    let user = user_service
        .update(UpdateUser {
            id: body.id,
            first_name: body.first_name,
            last_name: body.last_name,
            phone: body.phone.map(|phone| normalize_phone(&phone)),
            role: body.role,
            is_active: body.is_active,
            membership_tier,
            ..Default::default()
        })
        .await?;
    Ok(ApiResponse(user.into()))
}

pub async fn change_pin_handler(
    user_service: web::Data<dyn UserService>,
    claims: JwtClaims,
    body: web::Json<ChangePinDTO>,
) -> Result<ApiResponse<UserDTO>, ApiError> {
    let body = body.into_inner();

    if !is_valid_pin_format(&body.new_pin) {
        return Err(ApiError::from(UserError::InvalidPinFormat));
    }
    let user = user_service
        .change_pin(claims.sub, &body.current_pin, &body.new_pin)
        .await?;
    Ok(ApiResponse(user.into()))
}

/// Admin sets the customer's PIN directly (e.g. signing them up in person at
/// a branch) -- this mirrors self-signup's registration side effects, just
/// initiated by an employee instead of the customer.
pub async fn admin_create_user_handler(
    user_service: web::Data<dyn UserService>,
    body: web::Json<AdminCreateUserDTO>,
) -> Result<ApiResponse<UserDTO>, ApiError> {
    let body = body.into_inner();

    if !is_valid_phone(&body.phone) {
        return Err(ApiError::from(UserError::InvalidPhoneFormat));
    }
    let explicit_pin = body.pin.as_deref().map(str::trim).filter(|p| !p.is_empty());
    if let Some(pin) = explicit_pin {
        if !is_valid_pin_format(pin) {
            return Err(ApiError::from(UserError::InvalidPinFormat));
        }
    }
    // No PIN supplied: nobody (not even staff) knows it; the member sets
    // their own via the PIN-reset flow.
    let invite = explicit_pin.is_none();
    let pin = explicit_pin
        .map(str::to_string)
        .unwrap_or_else(|| format!("{:04}", rand::thread_rng().gen_range(0..10_000)));

    let user = user_service
        .register(
            CreateUser {
                email: body.email.map(|e| e.trim().to_lowercase()),
                pin_hash: hash_pin(&pin),
                first_name: body.first_name,
                last_name: body.last_name,
                phone: normalize_phone(&body.phone),
                membership_tier: "Silver".to_string(),
                membership_code: String::new(),
                referral_code: String::new(),
                hr_code: body.hr_code.map(|c| c.trim().to_string()).filter(|c| !c.is_empty()),
                date_of_birth: body.date_of_birth,
            },
            body.referred_by_code
                .map(|code| code.trim().to_uppercase())
                .filter(|code| !code.is_empty()),
        )
        .await?;

    if invite {
        let portal = std::env::var("PORTAL_URL").unwrap_or_default();
        let link = if portal.is_empty() { String::new() } else { format!(" Set your PIN at {}/auth?mode=forgot", portal.trim_end_matches('/')) };
        let text = format!(
            "Welcome to Bright Wings, {}! Your membership {} is ready.{} using this phone number.",
            user.first_name, user.membership_code, link
        );
        if shared::sms::sms_configured() {
            if let Err(err) = shared::sms::send_sms(&user.phone, &text).await {
                log::warn!("PIN setup invitation SMS failed for {}: {err}", user.phone);
            }
        }
    }

    if let Some(email) = user.email.clone() {
        let subject = "Your Bright Wings account is ready".to_string();
        let message = if invite {
            format!(
                "Hi {},\n\nYour Bright Wings membership {} is ready. Choose 'Forgot PIN' on the sign-in page with your phone number to set your own PIN.",
                user.first_name, user.membership_code
            )
        } else {
            format!(
                "Hi {},\n\nAn account has been created for you at Bright Wings. \
                 Log in with your phone number and the PIN your travel consultant gave you.",
                user.first_name
            )
        };
        let _ = web::block(move || {
            shared::mail::send_plain_email(&email, &subject, &message)
        })
        .await;
    }

    Ok(ApiResponse(user.into()))
}
