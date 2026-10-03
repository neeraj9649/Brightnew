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
    async fn authenticate(
        &self,
        phone: &str,
        pin: &str,
    ) -> Result<User, UserError>;
    async fn update(&self, update_user: UpdateUser) -> Result<User, UserError>;
    async fn change_pin(
        &self,
        user_id: Uuid,
        current_pin: &str,
        new_pin: &str,
    ) -> Result<User, UserError>;
    async fn list(&self) -> Result<ResultPaging<User>, UserError>;
    async fn get(&self, user_id: Uuid) -> Result<User, UserError>;
}
