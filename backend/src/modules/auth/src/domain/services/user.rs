use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::errors::user_errors::UserError;
use crate::domain::models::user::{CreateUser, UpdateUser, User};
use base::result_paging::ResultPaging;

#[async_trait]
pub trait UserService: 'static + Sync + Send {
    async fn register(
        &self,
        new_user: CreateUser,
        referred_by_code: Option<String>,
    ) -> Result<User, UserError>;
    /// The account for `phone` (stored form). `UserDoesNotExist` when there is none,
    /// `UserNotAuthorised` when it is deactivated. The one-time code is checked by the caller.
    async fn find_for_sign_in(&self, phone: &str) -> Result<User, UserError>;
    async fn update(&self, update_user: UpdateUser) -> Result<User, UserError>;
    async fn list(&self) -> Result<ResultPaging<User>, UserError>;
    async fn get(&self, user_id: Uuid) -> Result<User, UserError>;
    /// Associate a customer with a staff member (`None` clears it). `source` is one of
    /// staff_added / staff_code / referral / admin.
    async fn associate_staff(
        &self,
        user_id: Uuid,
        staff_id: Option<Uuid>,
        source: &str,
    ) -> Result<(), UserError>;
}
