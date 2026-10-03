use async_trait::async_trait;
use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::domain::errors::crm_errors::CrmError;
use crate::domain::models::task::Task;

#[async_trait]
pub trait TaskService: 'static + Sync + Send {
    async fn create_task(
        &self,
        booking_id: Option<Uuid>,
        assigned_to: Uuid,
        title: String,
        description: Option<String>,
        due_at: Option<DateTime<Utc>>,
        created_by: Uuid,
    ) -> Result<Task, CrmError>;
    async fn list_for_employee(&self, assigned_to: Uuid) -> Result<Vec<Task>, CrmError>;
    async fn list_for_booking(&self, booking_id: Uuid) -> Result<Vec<Task>, CrmError>;
    async fn complete(&self, task_id: Uuid) -> Result<Task, CrmError>;
    async fn cancel(&self, task_id: Uuid) -> Result<Task, CrmError>;
}
