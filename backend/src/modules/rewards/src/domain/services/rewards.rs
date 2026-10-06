use async_trait::async_trait;
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use uuid::Uuid;

use crate::domain::errors::reward_errors::RewardError;
use crate::domain::models::reward_transaction::{RewardReason, RewardTransaction};

#[async_trait]
pub trait RewardsService: 'static + Sync + Send {
    async fn award(
        &self,
        user_id: Uuid,
        points: i32,
        reason: RewardReason,
        source_type: Option<String>,
        source_id: Option<Uuid>,
        description: Option<String>,
        created_by: Option<Uuid>,
    ) -> Result<RewardTransaction, RewardError>;

    async fn award_referral_once(
        &self,
        user_id: Uuid,
        source_id: Uuid,
        points: i32,
        description: Option<String>,
    ) -> Result<Option<RewardTransaction>, RewardError>;

    /// Awards the configured per-type points for a just-completed booking,
    /// plus the first-booking bonus if this is the user's first one ever.
    async fn award_for_completed_booking(
        &self,
        user_id: Uuid,
        booking_id: Uuid,
        booking_type: &str,
    ) -> Result<Vec<RewardTransaction>, RewardError>;

    /// The configured welcome-bonus amount (DB-backed, admin-editable).
    async fn welcome_bonus(&self) -> i32;

    async fn referral_bonus(&self) -> i32;

    async fn history(
        &self,
        user_id: Uuid,
    ) -> Result<Vec<RewardTransaction>, RewardError>;

    /// Per-user point totals earned within `[period_start, period_end)` --
    /// the basis the referral job uses for its monthly cascade.
    async fn monthly_earned_totals(
        &self,
        period_start: DateTime<Utc>,
        period_end: DateTime<Utc>,
    ) -> Result<HashMap<Uuid, i64>, RewardError>;
}
