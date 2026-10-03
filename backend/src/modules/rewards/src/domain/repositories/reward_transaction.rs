use async_trait::async_trait;
use chrono::{DateTime, Utc};
use std::collections::HashMap;
use uuid::Uuid;

use crate::domain::models::reward_transaction::{
    CreateRewardTransaction, RewardTransaction,
};
use base::result_paging::RepositoryResult;

#[async_trait]
pub trait RewardTransactionRepository: Send + Sync {
    /// Inserts the ledger row and applies its point delta to the user's
    /// wallet (`users.tokens`) atomically, returning the new transaction.
    async fn create(
        &self,
        new_transaction: &CreateRewardTransaction,
    ) -> RepositoryResult<RewardTransaction>;
    async fn list_for_user(
        &self,
        user_id: Uuid,
    ) -> RepositoryResult<Vec<RewardTransaction>>;
    /// Whether this user has ever received a 'booking' or 'first_booking'
    /// reward -- used to decide if a completing booking is their first one.
    async fn has_booking_reward(&self, user_id: Uuid) -> RepositoryResult<bool>;
    /// Per-user point totals earned within `[period_start, period_end)`,
    /// only for users with at least one transaction in range.
    async fn sum_points_by_user_in_range(
        &self,
        period_start: DateTime<Utc>,
        period_end: DateTime<Utc>,
    ) -> RepositoryResult<HashMap<Uuid, i64>>;
}
