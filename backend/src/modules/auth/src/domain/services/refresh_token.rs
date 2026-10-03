use actix_web::HttpRequest;
use actix_web::cookie::Cookie;
use actix_web::dev::ServiceRequest;
use async_trait::async_trait;
use base::jwt_claims::JwtClaims;
use uuid::Uuid;

use crate::domain::errors::refresh_token_errors::RefreshTokenError;

#[async_trait]
pub trait RefreshTokenService: 'static + Sync + Send {
    async fn create_new_user_refresh_token(
        &self,
        user_id: Uuid,
    ) -> Result<String, RefreshTokenError>;
    async fn renew_refresh_token(
        &self,
        raw_token: String,
    ) -> Result<(String, Uuid), RefreshTokenError>;
    async fn revoke_refresh_token(
        &self,
        raw_token: String,
    ) -> Result<(), RefreshTokenError>;
    fn create_access_token(
        &self,
        user_id: Uuid,
        role: String,
    ) -> Result<String, RefreshTokenError>;
    fn build_refresh_token_cookie(
        &self,
        raw_token: String,
    ) -> Cookie<'static>;
    fn build_expired_refresh_token_cookie(&self) -> Cookie<'static>;
    fn verify_jwt(&self, token: &str) -> Result<JwtClaims, RefreshTokenError>;
    fn extract_refresh_token(
        &self,
        req: &HttpRequest,
    ) -> Result<String, RefreshTokenError>;
    fn extract_token(
        &self,
        req: &ServiceRequest,
    ) -> Result<String, RefreshTokenError>;
}
