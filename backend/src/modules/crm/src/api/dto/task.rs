use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateTaskDTO {
    #[serde(default)]
    pub booking_id: Option<Uuid>,
    pub assigned_to: Uuid,
    pub title: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub due_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct TaskDTO {
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

#[derive(Debug, Default, Deserialize)]
pub struct ListMyTasksQuery {
    /// Admin-only override to view a specific employee's queue.
    #[serde(default)]
    pub assigned_to: Option<Uuid>,
}
