use crate::domain::models::refresh_token::{CreateRefreshToken, RefreshToken, Rotation};
use chrono::{DateTime, Utc};
use async_trait::async_trait;
use base::result_paging::RepositoryResult;
use uuid::Uuid;

#[async_trait]
pub trait RefreshTokenRepository: Send + Sync {
    async fn create(
        &self,
        new_token: &CreateRefreshToken,
    ) -> RepositoryResult<RefreshToken>;
    async fn get_from_hash(
        &self,
        token_hash: String,
    ) -> RepositoryResult<Option<RefreshToken>>;
    async fn revoke_token(&self, id: Uuid) -> RepositoryResult<()>;
    async fn revoke_family_id(&self, family_id: Uuid) -> RepositoryResult<()>;
    /// Swaps `old_hash` for a new token in one transaction. Concurrent calls with the same token
    /// are serialised by a row lock, so exactly one of them rotates.
    async fn rotate(
        &self,
        old_hash: &str,
        new_hash: &str,
        now: DateTime<Utc>,
        new_expires_at: DateTime<Utc>,
        grace_seconds: i64,
    ) -> RepositoryResult<Rotation>;
    /// True while the sign-in still has a usable refresh token.
    async fn family_is_active(&self, family_id: Uuid) -> RepositoryResult<bool>;
}
