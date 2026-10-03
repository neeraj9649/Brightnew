use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateBookingDocumentDTO {
    pub booking_id: Uuid,
    /// ticket | quotation | voucher | invoice | other (enforced by DB CHECK).
    pub kind: String,
    pub file_id: String,
    #[serde(default)]
    pub label: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct BookingDocumentDTO {
    pub id: Uuid,
    pub booking_id: Uuid,
    pub kind: String,
    pub file_id: String,
    pub label: Option<String>,
    pub uploaded_by: Uuid,
    pub created_at: DateTime<Utc>,
}
