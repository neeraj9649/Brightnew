use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct BookingNote {
    pub id: Uuid,
    pub booking_id: Uuid,
    pub author_id: Uuid,
    pub note: String,
    pub note_type: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct CreateBookingNote {
    pub booking_id: Uuid,
    pub author_id: Uuid,
    pub note: String,
    pub note_type: String,
}
