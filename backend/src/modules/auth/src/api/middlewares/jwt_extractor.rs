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
    let claims = token_service.verify_jwt(&token).map_err(ApiError::from)?;

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
