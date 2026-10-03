use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateBookingDTO {
    #[serde(rename = "type")]
    pub booking_type: String,
    #[serde(default)]
    pub membership_tier_snapshot: Option<String>,
    pub estimated_cost: f64,
    #[serde(default)]
    pub special_requests: Option<String>,
    /// Type-specific fields (flight/hotel/tour/visa), stored as-is.
    #[serde(default)]
    pub details: Value,
}

/// Staff (admin/employee) creating a booking on behalf of a customer. Same
/// fields as CreateBookingDTO plus the target customer's id.
#[derive(Debug, Deserialize)]
pub struct StaffCreateBookingDTO {
    pub user_id: Uuid,
    #[serde(flatten)]
    pub booking: CreateBookingDTO,
}

#[derive(Debug, Serialize)]
pub struct BookingDTO {
    pub id: Uuid,
    pub display_code: String,
    pub user_id: Uuid,
    #[serde(rename = "type")]
    pub booking_type: String,
    pub status: String,
    pub membership_tier_snapshot: Option<String>,
    pub estimated_cost: f64,
    pub final_cost: f64,
    pub payment_status: String,
    pub special_requests: Option<String>,
    pub admin_notes: Option<String>,
    pub assigned_employee_id: Option<Uuid>,
    pub details: Value,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct AdminUpdateBookingDTO {
    pub id: Uuid,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub final_cost: Option<f64>,
    #[serde(default)]
    pub payment_status: Option<String>,
    #[serde(default)]
    pub admin_notes: Option<String>,
    #[serde(default)]
    pub assigned_employee_id: Option<Uuid>,
}

#[derive(Debug, Default, Deserialize)]
pub struct AdminListBookingsQuery {
    #[serde(default)]
    pub status: Option<String>,
    /// Ignored for employee callers (forced to their own id); usable by
    /// admins to filter the full list down to one employee's bookings.
    #[serde(default)]
    pub assigned_employee_id: Option<Uuid>,
}
