use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::models::task::{CreateTask, Task};
use crate::domain::repositories::task::TaskRepository;
use base::result_paging::RepositoryResult;

pub struct TaskSqlxRepository {
    pub pool: PgPool,
}

impl TaskSqlxRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl TaskRepository for TaskSqlxRepository {
    async fn create(&self, new_task: &CreateTask) -> RepositoryResult<Task> {
        Ok(sqlx::query_as!(
            Task,
            r#"
            INSERT INTO tasks
                (id, booking_id, assigned_to, title, description, due_at, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, booking_id, assigned_to, title, description, due_at,
                status, created_by, created_at, completed_at
            "#,
            Uuid::new_v4(),
            new_task.booking_id,
            new_task.assigned_to,
            new_task.title,
            new_task.description,
            new_task.due_at,
            new_task.created_by
        )
        .fetch_one(&self.pool)
        .await?)
    }

    async fn get(&self, task_id: Uuid) -> RepositoryResult<Option<Task>> {
        Ok(sqlx::query_as!(
            Task,
            r#"
            SELECT id, booking_id, assigned_to, title, description, due_at,
                status, created_by, created_at, completed_at
            FROM tasks WHERE id = $1
            "#,
            task_id
        )
        .fetch_optional(&self.pool)
        .await?)
    }

    async fn list_for_employee(
        &self,
        assigned_to: Uuid,
    ) -> RepositoryResult<Vec<Task>> {
        Ok(sqlx::query_as!(
            Task,
            r#"
            SELECT id, booking_id, assigned_to, title, description, due_at,
                status, created_by, created_at, completed_at
            FROM tasks WHERE assigned_to = $1
            ORDER BY due_at ASC NULLS LAST, created_at DESC
            "#,
            assigned_to
        )
        .fetch_all(&self.pool)
        .await?)
    }

    async fn list_for_booking(
        &self,
        booking_id: Uuid,
    ) -> RepositoryResult<Vec<Task>> {
        Ok(sqlx::query_as!(
            Task,
            r#"
            SELECT id, booking_id, assigned_to, title, description, due_at,
                status, created_by, created_at, completed_at
            FROM tasks WHERE booking_id = $1 ORDER BY created_at DESC
            "#,
            booking_id
        )
        .fetch_all(&self.pool)
        .await?)
    }

    async fn set_status(&self, task_id: Uuid, status: &str) -> RepositoryResult<Task> {
        Ok(sqlx::query_as!(
            Task,
            r#"
            UPDATE tasks
            SET status = $2::varchar,
                completed_at = CASE WHEN $2::varchar = 'done' THEN NOW() ELSE completed_at END
            WHERE id = $1
            RETURNING id, booking_id, assigned_to, title, description, due_at,
                status, created_by, created_at, completed_at
            "#,
            task_id,
            status
        )
        .fetch_one(&self.pool)
        .await?)
    }
}
