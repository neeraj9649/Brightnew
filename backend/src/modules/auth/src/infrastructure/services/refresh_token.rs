use actix_web::HttpRequest;
use actix_web::cookie::time::Duration as CookieDuration;
use actix_web::cookie::{Cookie, SameSite};
use actix_web::dev::ServiceRequest;
use actix_web::http::header::AUTHORIZATION;
use async_trait::async_trait;
use base::jwt_claims::JwtClaims;
use jsonwebtoken::{
    DecodingKey, EncodingKey, Header, Validation, decode, encode,
};
use sha2::{Digest, Sha256};
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

use crate::domain::errors::refresh_token_errors::RefreshTokenError;
use crate::domain::models::refresh_token::CreateRefreshToken;
use crate::domain::repositories::refresh_token::RefreshTokenRepository;
use crate::domain::repositories::user::UserRepository;
use crate::domain::services::refresh_token::RefreshTokenService;
use crate::infrastructure::repositories::refresh_token::RefreshTokenSqlxRepository;
use base::constants;

#[derive(Clone)]
pub struct RefreshTokenServiceImpl {
    pub repository: Arc<dyn RefreshTokenRepository>,
    pub user_repository: Arc<dyn UserRepository>,
}

impl RefreshTokenServiceImpl {
    pub fn new(pool: PgPool, user_repository: Arc<dyn UserRepository>) -> Self {
        Self {
            repository: Arc::new(RefreshTokenSqlxRepository::new(pool)),
            user_repository,
        }
    }

    fn hash_token(&self, token: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(token.as_bytes());
        hex::encode(hasher.finalize())
    }

    async fn create_refresh_token(
        &self,
        user_id: Uuid,
        family_id: Uuid,
    ) -> Result<String, RefreshTokenError> {
        let raw_token = Uuid::new_v4().to_string();
        let secure_hash = self.hash_token(&raw_token);
        let mut token = CreateRefreshToken::new(user_id, secure_hash);
        token.family_id = family_id;
        self.repository
            .create(&token)
            .await
            .map_err(RefreshTokenError::InternalServerError)?;
        Ok(raw_token)
    }
}

#[async_trait]
impl RefreshTokenService for RefreshTokenServiceImpl {
    async fn create_new_user_refresh_token(
        &self,
        user_id: Uuid,
    ) -> Result<String, RefreshTokenError> {
        self.create_refresh_token(user_id, Uuid::new_v4()).await
    }

    async fn renew_refresh_token(
        &self,
        raw_token: String,
    ) -> Result<(String, Uuid), RefreshTokenError> {
        let token_hash = self.hash_token(&raw_token);
        let refresh_token = self
            .repository
            .get_from_hash(token_hash)
            .await
            .map_err(RefreshTokenError::InternalServerError)?
            .ok_or(RefreshTokenError::RefreshTokenDoesNotExist)?;

        if refresh_token.is_revoked
            || refresh_token.expires_at < chrono::Utc::now()
        {
            self.repository
                .revoke_family_id(refresh_token.family_id)
                .await
                .map_err(RefreshTokenError::InternalServerError)?;
            return Err(RefreshTokenError::InvalidToken);
        }

        let user = self
            .user_repository
            .get(refresh_token.user_id)
            .await
            .map_err(RefreshTokenError::InternalServerError)?
            .ok_or(RefreshTokenError::InvalidToken)?;
        if !user.is_active {
            self.repository
                .revoke_family_id(refresh_token.family_id)
                .await
                .map_err(RefreshTokenError::InternalServerError)?;
            return Err(RefreshTokenError::InvalidToken);
        }

        self.repository
            .revoke_token(refresh_token.id)
            .await
            .map_err(RefreshTokenError::InternalServerError)?;

        let new_raw_token = self
            .create_refresh_token(refresh_token.user_id, refresh_token.family_id)
            .await?;

        Ok((new_raw_token, refresh_token.user_id))
    }

    async fn revoke_refresh_token(
        &self,
        raw_token: String,
    ) -> Result<(), RefreshTokenError> {
        let token_hash = self.hash_token(&raw_token);
        let refresh_token = self
            .repository
            .get_from_hash(token_hash)
            .await
            .map_err(RefreshTokenError::InternalServerError)?
            .ok_or(RefreshTokenError::RefreshTokenDoesNotExist)?;

        self.repository
            .revoke_family_id(refresh_token.family_id)
            .await
            .map_err(RefreshTokenError::InternalServerError)
    }

    fn create_access_token(
        &self,
        user_id: Uuid,
        role: String,
    ) -> Result<String, RefreshTokenError> {
        let claims = JwtClaims::new(user_id, role);
        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(constants::JWT_SECRET.as_bytes()),
        )
        .map_err(|err| RefreshTokenError::InternalServerError(err.into()))
    }

    fn build_refresh_token_cookie(
        &self,
        raw_token: String,
    ) -> Cookie<'static> {
        let secure = !cfg!(debug_assertions);
        Cookie::build(
            (*constants::REFRESH_TOKEN_COOKIE_NAME).clone(),
            raw_token,
        )
        .http_only(true)
        // SameSite=None is required for a cross-site production portal/API
        // pair and browsers require Secure with it. Local HTTP previews use
        // Lax so the refresh cookie is not silently rejected.
        .secure(secure)
        .same_site(if secure { SameSite::None } else { SameSite::Lax })
        .path("/")
        .max_age(CookieDuration::days(*constants::REFRESH_TOKEN_EXP_DAYS))
        .finish()
    }

    fn build_expired_refresh_token_cookie(&self) -> Cookie<'static> {
        let secure = !cfg!(debug_assertions);
        Cookie::build((*constants::REFRESH_TOKEN_COOKIE_NAME).clone(), "")
            .http_only(true)
            .secure(secure)
            .same_site(if secure { SameSite::None } else { SameSite::Lax })
            .path("/")
            .max_age(CookieDuration::seconds(0))
            .finish()
    }

    fn verify_jwt(&self, token: &str) -> Result<JwtClaims, RefreshTokenError> {
        let validation = Validation::new(jsonwebtoken::Algorithm::HS256);
        let token_data = decode::<JwtClaims>(
            token,
            &DecodingKey::from_secret(constants::JWT_SECRET.as_bytes()),
            &validation,
        )
        .map_err(|err| match err.kind() {
            jsonwebtoken::errors::ErrorKind::ExpiredSignature => {
                RefreshTokenError::TokenExpired
            }
            _ => RefreshTokenError::InvalidToken,
        })?;

        Ok(token_data.claims)
    }

    fn extract_refresh_token(
        &self,
        req: &HttpRequest,
    ) -> Result<String, RefreshTokenError> {
        req.cookie(&constants::REFRESH_TOKEN_COOKIE_NAME)
            .map(|cookie| cookie.value().to_string())
            .ok_or(RefreshTokenError::RefreshTokenDoesNotExist)
    }

    fn extract_token(
        &self,
        req: &ServiceRequest,
    ) -> Result<String, RefreshTokenError> {
        let auth_header = req
            .headers()
            .get(AUTHORIZATION)
            .ok_or(RefreshTokenError::JwtTokenDoesNotExist)?;
        let auth_header = auth_header
            .to_str()
            .map_err(|_| RefreshTokenError::InvalidTokenFormat)?;

        auth_header
            .strip_prefix("Bearer ")
            .map(|token| token.to_string())
            .ok_or(RefreshTokenError::InvalidTokenFormat)
    }
}
