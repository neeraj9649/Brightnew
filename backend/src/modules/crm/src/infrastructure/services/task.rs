use async_trait::async_trait;
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

use crate::domain::errors::crm_errors::CrmError;
use crate::domain::models::task::{CreateTask, Task};
use crate::domain::repositories::task::TaskRepository;
use crate::domain::services::task::TaskService;
use crate::infrastructure::repositories::task::TaskSqlxRepository;

#[derive(Clone)]
pub struct TaskServiceImpl {
    pub repository: Arc<dyn TaskRepository>,
}

impl TaskServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { repository: Arc::new(TaskSqlxRepository::new(pool)) }
    }
}

#[async_trait]
impl TaskService for TaskServiceImpl {
    async fn create_task(
        &self,
        booking_id: Option<Uuid>,
        assigned_to: Uuid,
        title: String,
        description: Option<String>,
        due_at: Option<DateTime<Utc>>,
        created_by: Uuid,
    ) -> Result<Task, CrmError> {
        if title.trim().is_empty() {
            return Err(CrmError::InvalidInput("Title cannot be empty".to_string()));
        }
        self.repository
            .create(&CreateTask {
                booking_id,
                assigned_to,
                title,
                description,
                due_at,
                created_by,
            })
            .await
            .map_err(CrmError::InternalServerError)
    }

    async fn list_for_employee(&self, assigned_to: Uuid) -> Result<Vec<Task>, CrmError> {
        self.repository
            .list_for_employee(assigned_to)
            .await
            .map_err(CrmError::InternalServerError)
    }

    async fn list_for_booking(&self, booking_id: Uuid) -> Result<Vec<Task>, CrmError> {
        self.repository
            .list_for_booking(booking_id)
            .await
            .map_err(CrmError::InternalServerError)
    }

    async fn complete(&self, task_id: Uuid) -> Result<Task, CrmError> {
        self.repository
            .get(task_id)
            .await
            .map_err(CrmError::InternalServerError)?
            .ok_or(CrmError::NotFound)?;
        self.repository
            .set_status(task_id, "done")
            .await
            .map_err(CrmError::InternalServerError)
    }

    async fn cancel(&self, task_id: Uuid) -> Result<Task, CrmError> {
        self.repository
            .get(task_id)
            .await
            .map_err(CrmError::InternalServerError)?
            .ok_or(CrmError::NotFound)?;
        self.repository
            .set_status(task_id, "cancelled")
            .await
            .map_err(CrmError::InternalServerError)
    }
}
