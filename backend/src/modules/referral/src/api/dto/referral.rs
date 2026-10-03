use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct RunMonthlyPayoutDTO {
    pub year: i32,
    /// 1-12.
    pub month: u32,
}

#[derive(Debug, Serialize)]
pub struct PayoutRunResultDTO {
    pub period_start: DateTime<Utc>,
    pub period_end: DateTime<Utc>,
    pub users_paid: i32,
    pub total_points_paid: i64,
}
