use crate::domain::models::refresh_token::{CreateRefreshToken, RefreshToken};
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
}
