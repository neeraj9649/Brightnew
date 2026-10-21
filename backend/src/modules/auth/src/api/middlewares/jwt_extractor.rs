use std::sync::Arc;

use actix_web::{
    Error, HttpMessage,
    body::MessageBody,
    dev::{ServiceRequest, ServiceResponse},
    middleware::Next,
    web,
};

use crate::domain::errors::middleware_errors::MiddlewareError;
use crate::domain::services::refresh_token::RefreshTokenService;
use crate::domain::services::user::UserService;
use base::error::ApiError;

/// An empty `allowed_roles` only checks that a valid access token is
/// present (any role). A non-empty slice additionally requires
/// `claims.role` to be one of them -- see `base::role` for the shared
/// constants (`ADMIN_ONLY`, `STAFF`, etc).
pub async fn check_permission_middleware(
    req: ServiceRequest,
    next: Next<impl MessageBody>,
    allowed_roles: &[&str],
) -> Result<ServiceResponse<impl MessageBody>, Error> {
    let token_service = get_service::<dyn RefreshTokenService>(&req)?;

    let token = token_service.extract_token(&req).map_err(ApiError::from)?;
    let mut claims = token_service.verify_jwt(&token).map_err(ApiError::from)?;

    // A logout, "sign out other devices" or PIN reset ends the session immediately, even
    // though the access token itself is long-lived.
    if let Some(session_id) = claims.sid {
        if !token_service.session_is_active(session_id).await.map_err(ApiError::from)? {
            return Err(ApiError::new("Your session has ended. Please sign in again.", 401).into());
        }
    }

    let user_service = get_service::<dyn UserService>(&req)?;
    let user = user_service.get(claims.sub).await.map_err(ApiError::from)?;
    if !user.is_active {
        return Err(ApiError::new("Account is inactive", 403).into());
    }

    // Trust the account's current role, not the one baked into the token, so a
    // demotion takes effect on the next request instead of after the token expires.
    claims.role = user.role.clone();

    if !allowed_roles.is_empty() && !allowed_roles.contains(&claims.role.as_str())
    {
        return Err(ApiError::from(MiddlewareError::Forbidden).into());
    }

    req.extensions_mut().insert(claims);
    next.call(req).await
}

fn get_service<T: 'static + Sync + Send + ?Sized>(
    req: &ServiceRequest,
) -> Result<Arc<T>, ApiError> {
    match req.app_data::<web::Data<T>>() {
        None => Err(MiddlewareError::InternalServerError(
            "Unable to get service",
        )
        .into()),
        Some(service) => Ok(Arc::clone(service)),
    }
}
