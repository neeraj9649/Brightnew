use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::models::task::{CreateTask, Task};
use base::result_paging::RepositoryResult;

#[async_trait]
pub trait TaskRepository: Send + Sync {
    async fn create(&self, new_task: &CreateTask) -> RepositoryResult<Task>;
    async fn get(&self, task_id: Uuid) -> RepositoryResult<Option<Task>>;
    async fn list_for_employee(
        &self,
        assigned_to: Uuid,
    ) -> RepositoryResult<Vec<Task>>;
    async fn list_for_booking(
        &self,
        booking_id: Uuid,
    ) -> RepositoryResult<Vec<Task>>;
    /// `status` is `'done'` or `'cancelled'`.
    async fn set_status(&self, task_id: Uuid, status: &str) -> RepositoryResult<Task>;
}
