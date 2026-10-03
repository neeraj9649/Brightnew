use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RewardReason {
    WelcomeBonus,
    FirstBooking,
    Booking,
    Manual,
    Referral,
    Redemption,
}

impl RewardReason {
    pub fn as_str(&self) -> &'static str {
        match self {
            RewardReason::WelcomeBonus => "welcome_bonus",
            RewardReason::FirstBooking => "first_booking",
            RewardReason::Booking => "booking",
            RewardReason::Manual => "manual",
            RewardReason::Referral => "referral",
            RewardReason::Redemption => "redemption",
        }
    }
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct RewardTransaction {
    pub id: Uuid,
    pub user_id: Uuid,
    pub points: i32,
    pub reason: String,
    pub source_type: Option<String>,
    pub source_id: Option<Uuid>,
    pub description: Option<String>,
    pub created_by: Option<Uuid>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct CreateRewardTransaction {
    pub user_id: Uuid,
    pub points: i32,
    pub reason: RewardReason,
    pub source_type: Option<String>,
    pub source_id: Option<Uuid>,
    pub description: Option<String>,
    pub created_by: Option<Uuid>,
}
