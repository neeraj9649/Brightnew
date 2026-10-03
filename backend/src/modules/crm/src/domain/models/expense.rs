use bigdecimal::BigDecimal;
use chrono::{DateTime, NaiveDate, Utc};
use uuid::Uuid;

/// A cost line that makes up a booking's package. A line with start/end dates
/// doubles as a "schedule" leg (a cab/hotel/flight); without dates it's a plain
/// expense. Per-booking PnL = bookings.final_cost - SUM(amount).
#[derive(Debug, Clone, sqlx::FromRow)]
pub struct BookingExpense {
    pub id: Uuid,
    pub booking_id: Uuid,
    pub category: String,
    pub amount: BigDecimal,
    pub vendor: Option<String>,
    pub description: Option<String>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub file_id: Option<String>,
    pub created_by: Uuid,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct CreateBookingExpense {
    pub booking_id: Uuid,
    pub category: String,
    pub amount: BigDecimal,
    pub vendor: Option<String>,
    pub description: Option<String>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub file_id: Option<String>,
    pub created_by: Uuid,
}
