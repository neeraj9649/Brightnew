use actix_web::web;
use base::error::{ApiError, ApiResponse};
use base::jwt_claims::JwtClaims;
use base::result_paging::ResultPaging;

use crate::api::dto::user::{
    AdminCreateUserDTO, AdminUpdateUserDTO, ChangePinDTO, UpdateProfileDTO, UserDTO,
};
use crate::api::utils::pin::{hash_pin, is_valid_pin_format};
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
    let user = user_service
        .update(UpdateUser {
            id: claims.sub,
            first_name: body.first_name,
            last_name: body.last_name,
            phone: body.phone,
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
            phone: body.phone,
            role: body.role,
            is_active: body.is_active,
            membership_tier,
            tokens: body.tokens,
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
                membership_tier: "Silver".to_string(),
                membership_code: String::new(),
                referral_code: String::new(),
                hr_code: body.hr_code.map(|c| c.trim().to_string()).filter(|c| !c.is_empty()),
                date_of_birth: body.date_of_birth,
            },
            body.referred_by_code,
        )
        .await?;

    if let Some(email) = user.email.clone() {
        let subject = "Your Bright Wings account is ready".to_string();
        let message = format!(
            "Hi {},\n\nAn account has been created for you at Bright Wings. \
             Log in with your phone number and the PIN your travel consultant gave you.",
            user.first_name
        );
        let _ = web::block(move || {
            shared::mail::send_plain_email(&email, &subject, &message)
        })
        .await;
    }

    Ok(ApiResponse(user.into()))
}
