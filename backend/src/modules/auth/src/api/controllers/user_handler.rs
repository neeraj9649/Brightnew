use actix_web::web;
use base::error::{ApiError, ApiResponse};
use base::jwt_claims::JwtClaims;
use base::role;
use base::result_paging::ResultPaging;

use crate::api::dto::user::{
    AdminCreateUserDTO, AdminUpdateUserDTO, UpdateProfileDTO, UserDTO,
};
use crate::api::utils::pin::unusable_pin_hash;
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
    if body.first_name.as_deref().is_some_and(|n| n.trim().is_empty() || n.chars().count() > 80)
        || body.last_name.as_deref().is_some_and(|n| n.chars().count() > 80)
        || body.profile_image_file_id.as_deref().is_some_and(|id| id.len() > 200)
    {
        return Err(ApiError::new("Name or photo reference is too long", 400));
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
    claims: JwtClaims,
    path: web::Path<uuid::Uuid>,
) -> Result<ApiResponse<UserDTO>, ApiError> {
    let user = user_service.get(path.into_inner()).await?;
    // Employees look up customers only; staff and admin accounts stay admin-only.
    if !role::is_admin(&claims.role) && user.role != role::CUSTOMER {
        return Err(ApiError::new("User not found", 404));
    }
    Ok(ApiResponse(user.into()))
}

pub async fn admin_update_user_handler(
    user_service: web::Data<dyn UserService>,
    claims: JwtClaims,
    body: web::Json<AdminUpdateUserDTO>,
) -> Result<ApiResponse<UserDTO>, ApiError> {
    let body = body.into_inner();
    if body.phone.as_deref().is_some_and(|phone| !is_valid_phone(phone)) {
        return Err(ApiError::from(UserError::InvalidPhoneFormat));
    }
    if body.role.as_deref().is_some_and(|role| {
        !matches!(role, "customer" | "employee" | "admin" | "super_admin")
    }) {
        return Err(ApiError::new("Invalid user role", 400));
    }
    // Only a super admin may touch admin-level accounts or hand out admin
    // roles, and nobody may change their own role or deactivate themselves
    // (so at least one super admin always remains).
    if claims.role != role::SUPER_ADMIN {
        let grants_admin = body.role.as_deref().is_some_and(role::is_admin);
        let target = user_service.get(body.id).await?;
        if grants_admin || role::is_admin(&target.role) {
            return Err(ApiError::new("Only a super admin can manage admin accounts", 403));
        }
    }
    if body.id == claims.sub
        && (body.role.as_deref().is_some_and(|r| r != claims.role) || body.is_active == Some(false))
    {
        return Err(ApiError::new("You can't change your own role or deactivate your own account", 400));
    }
    let membership_tier = body.membership_tier.map(|tier| match tier.as_str() {
        // Bronze was used by the legacy portal and Titanium has been retired; Member is the entry level.
        "Bronze" | "bronze" | "member" => "Member".to_string(),
        "silver" => "Silver".to_string(),
        "gold" => "Gold".to_string(),
        "platinum" | "titanium" | "Titanium" => "Platinum".to_string(),
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

/// Staff sign someone up (e.g. in person at a branch). This mirrors self-signup's
/// registration side effects, just initiated by staff. Staff never see or set a passcode: the
/// member sets their own with "Forgot passcode" (a code by SMS).
pub async fn admin_create_user_handler(
    user_service: web::Data<dyn UserService>,
    claims: JwtClaims,
    body: web::Json<AdminCreateUserDTO>,
) -> Result<ApiResponse<UserDTO>, ApiError> {
    let body = body.into_inner();

    // Who looks after the new customer: the employee who adds them, or the staff member an admin picks.
    let creator_is_employee = claims.role == role::EMPLOYEE;
    let staff_id = if creator_is_employee { Some(claims.sub) } else { body.associated_staff_id };
    if !creator_is_employee {
        if let Some(staff) = staff_id {
            let member = user_service.get(staff).await?;
            if !role::STAFF.contains(&member.role.as_str()) || !member.is_active {
                return Err(ApiError::new("Choose an active staff member", 400));
            }
        }
    }

    if !is_valid_phone(&body.phone) {
        return Err(ApiError::from(UserError::InvalidPhoneFormat));
    }
    if body.first_name.trim().is_empty()
        || body.first_name.chars().count() > 80
        || body.last_name.as_deref().is_some_and(|n| n.chars().count() > 80)
    {
        return Err(ApiError::new("Name must be 1 to 80 characters", 400));
    }
    let user = user_service
        .register(
            CreateUser {
                email: body.email.map(|e| e.trim().to_lowercase()),
                pin_hash: unusable_pin_hash(),
                first_name: body.first_name,
                last_name: body.last_name,
                phone: normalize_phone(&body.phone),
                membership_tier: "Member".to_string(),
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

    // Tell the member how to sign in. Best effort: the account exists either way.
    let portal = std::env::var("PORTAL_URL").unwrap_or_default();
    let link = if portal.is_empty() { String::new() } else { format!(" at {}/auth", portal.trim_end_matches('/')) };
    let text = format!(
        "Welcome to Bright Wings, {}! Your membership {} is ready. To sign in{}, tap \"Forgot passcode\", enter this phone number and set your own 4-digit passcode with the code we text you.",
        user.first_name, user.membership_code, link
    );
    if shared::sms::sms_configured() {
        if let Err(err) = shared::sms::send_sms(&user.phone, &text).await {
            log::warn!("Welcome SMS failed for {}: {err}", user.phone);
        }
    }
    if let Some(email) = user.email.clone() {
        let _ = web::block(move || {
            shared::mail::send_plain_email(&email, "Your Bright Wings account is ready", &text)
        })
        .await;
    }

    if let Some(staff) = staff_id {
        user_service
            .associate_staff(user.id, Some(staff), if creator_is_employee { "staff_added" } else { "admin" })
            .await?;
    }

    Ok(ApiResponse(user.into()))
}
