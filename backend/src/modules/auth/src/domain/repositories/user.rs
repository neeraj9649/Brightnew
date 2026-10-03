use crate::domain::models::user::{CreateUser, UpdateUser, User};
use async_trait::async_trait;
use base::result_paging::{RepositoryResult, ResultPaging};
use uuid::Uuid;

#[async_trait]
pub trait UserRepository: Send + Sync {
    async fn create(&self, new_user: &CreateUser) -> RepositoryResult<User>;
    async fn update(&self, update_user: &UpdateUser) -> RepositoryResult<User>;
    async fn list(&self) -> RepositoryResult<ResultPaging<User>>;
    async fn get(&self, user_id: Uuid) -> RepositoryResult<Option<User>>;
    async fn get_by_phone(
        &self,
        phone: &str,
    ) -> RepositoryResult<Option<User>>;
    async fn get_by_referral_code(
        &self,
        referral_code: &str,
    ) -> RepositoryResult<Option<User>>;
}
