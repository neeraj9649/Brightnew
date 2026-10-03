use chrono::{DateTime, Utc};
use uuid::Uuid;

/// A "follow-up" is just a task with a due date -- one model covers both.
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct Task {
    pub id: Uuid,
    pub booking_id: Option<Uuid>,
    pub assigned_to: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub due_at: Option<DateTime<Utc>>,
    pub status: String,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
    pub completed_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone)]
pub struct CreateTask {
    pub booking_id: Option<Uuid>,
    pub assigned_to: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub due_at: Option<DateTime<Utc>>,
    pub created_by: Uuid,
}
