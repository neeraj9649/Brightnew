use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateBookingExpenseDTO {
    pub booking_id: Uuid,
    pub category: String,
    pub amount: f64,
    #[serde(default)]
    pub vendor: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub start_date: Option<NaiveDate>,
    #[serde(default)]
    pub end_date: Option<NaiveDate>,
    /// Optional already-uploaded receipt/voucher file id.
    #[serde(default)]
    pub file_id: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct BookingExpenseDTO {
    pub id: Uuid,
    pub booking_id: Uuid,
    pub category: String,
    pub amount: f64,
    pub vendor: Option<String>,
    pub description: Option<String>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub file_id: Option<String>,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
}
