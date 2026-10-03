use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateQuotationDTO {
    pub booking_id: Uuid,
    pub file_id: String,
}

#[derive(Debug, Serialize)]
pub struct QuotationDTO {
    pub id: Uuid,
    pub booking_id: Uuid,
    pub file_id: String,
    pub uploaded_by: Uuid,
    pub created_at: DateTime<Utc>,
}
