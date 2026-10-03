use async_trait::async_trait;
use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::domain::models::referral::Referral;
use base::result_paging::RepositoryResult;

#[async_trait]
pub trait ReferralRepository: Send + Sync {
    async fn create(
        &self,
        referrer_id: Uuid,
        referred_id: Uuid,
    ) -> RepositoryResult<Referral>;
    /// All (referred_id, referrer_id) edges in the forest.
    async fn all_edges(&self) -> RepositoryResult<Vec<(Uuid, Uuid)>>;
    async fn referrer_of(&self, user_id: Uuid) -> RepositoryResult<Option<Uuid>>;
    async fn count_direct_referrals(&self, referrer_id: Uuid) -> RepositoryResult<i64>;
    /// Reserves this period before any payouts are applied. Fails on a
    /// unique-constraint violation if the period was already run -- the
    /// caller maps that into `ReferralError::PayoutAlreadyRun`. Must be
    /// called (and succeed) before awarding anything, so a duplicate call
    /// fails fast instead of double-paying.
    async fn reserve_payout_run(
        &self,
        period_start: DateTime<Utc>,
        period_end: DateTime<Utc>,
    ) -> RepositoryResult<()>;
    /// Fills in the final totals once payouts have actually been applied.
    async fn finalize_payout_run(
        &self,
        period_start: DateTime<Utc>,
        period_end: DateTime<Utc>,
        users_paid: i32,
        total_points_paid: i64,
    ) -> RepositoryResult<()>;
}
