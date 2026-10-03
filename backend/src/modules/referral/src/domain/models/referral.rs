use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct Referral {
    pub id: Uuid,
    pub referrer_id: Uuid,
    pub referred_id: Uuid,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct PayoutRunSummary {
    pub period_start: DateTime<Utc>,
    pub period_end: DateTime<Utc>,
    pub users_paid: i32,
    pub total_points_paid: i64,
}
