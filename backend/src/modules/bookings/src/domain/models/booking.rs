use bigdecimal::BigDecimal;
use chrono::{DateTime, Utc};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct Booking {
    pub id: Uuid,
    pub display_code: String,
    pub user_id: Uuid,
    #[sqlx(rename = "type")]
    pub booking_type: String,
    pub status: String,
    pub membership_tier_snapshot: Option<String>,
    pub estimated_cost: BigDecimal,
    pub final_cost: BigDecimal,
    pub payment_status: String,
    pub special_requests: Option<String>,
    pub admin_notes: Option<String>,
    pub assigned_employee_id: Option<Uuid>,
    pub details: Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct CreateBooking {
    pub display_code: String,
    pub user_id: Uuid,
    pub booking_type: String,
    pub membership_tier_snapshot: Option<String>,
    pub estimated_cost: BigDecimal,
    pub special_requests: Option<String>,
    pub details: Value,
}

#[derive(Debug, Clone, Default)]
pub struct UpdateBooking {
    pub id: Uuid,
    pub status: Option<String>,
    pub final_cost: Option<BigDecimal>,
    pub payment_status: Option<String>,
    pub admin_notes: Option<String>,
    pub assigned_employee_id: Option<Uuid>,
}
