use crate::api::dto::task::TaskDTO;
use crate::domain::models::task::Task;

impl From<Task> for TaskDTO {
    fn from(value: Task) -> Self {
        Self {
            id: value.id,
            booking_id: value.booking_id,
            assigned_to: value.assigned_to,
            title: value.title,
            description: value.description,
            due_at: value.due_at,
            status: value.status,
            created_by: value.created_by,
            created_at: value.created_at,
            completed_at: value.completed_at,
        }
    }
}
