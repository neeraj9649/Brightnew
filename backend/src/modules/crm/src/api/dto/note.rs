use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

fn default_note_type() -> String {
    "communication".to_string()
}

#[derive(Debug, Deserialize)]
pub struct CreateNoteDTO {
    pub booking_id: Uuid,
    pub note: String,
    /// "communication" (default) or "support".
    #[serde(default = "default_note_type")]
    pub note_type: String,
}

#[derive(Debug, Serialize)]
pub struct NoteDTO {
    pub id: Uuid,
    pub booking_id: Uuid,
    pub author_id: Uuid,
    pub note: String,
    pub note_type: String,
    pub created_at: DateTime<Utc>,
}
