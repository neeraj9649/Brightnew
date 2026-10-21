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
    /// The staff member a customer is associated with, if any.
    async fn get_associated_staff(&self, user_id: Uuid) -> RepositoryResult<Option<Uuid>>;
    /// Associate a customer with a staff member (`None` clears it). `source` is one of
    /// staff_added / staff_code / referral / admin.
    async fn set_associated_staff(
        &self,
        user_id: Uuid,
        staff_id: Option<Uuid>,
        source: &str,
    ) -> RepositoryResult<()>;
}
