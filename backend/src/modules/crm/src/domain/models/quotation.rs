use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct Quotation {
    pub id: Uuid,
    pub booking_id: Uuid,
    pub file_id: String,
    pub uploaded_by: Uuid,
    pub created_at: DateTime<Utc>,
}

/// `file_id` comes from an already-completed upload via
/// `/uploads/booking-document` -- this just links it to a booking, no new
/// upload path.
#[derive(Debug, Clone)]
pub struct CreateQuotation {
    pub booking_id: Uuid,
    pub file_id: String,
    pub uploaded_by: Uuid,
}
