use chrono::{DateTime, Utc};
use uuid::Uuid;

/// Any file attached to a booking, typed by `kind`
/// (ticket/quotation/voucher/invoice/other). `file_id` points at an
/// already-uploaded file, so view/download reuses the existing file URL.
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct BookingDocument {
    pub id: Uuid,
    pub booking_id: Uuid,
    pub kind: String,
    pub file_id: String,
    pub label: Option<String>,
    pub uploaded_by: Uuid,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct CreateBookingDocument {
    pub booking_id: Uuid,
    pub kind: String,
    pub file_id: String,
    pub label: Option<String>,
    pub uploaded_by: Uuid,
}
