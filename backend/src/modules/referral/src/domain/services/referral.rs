use async_trait::async_trait;
use chrono::{DateTime, Utc};
use uuid::Uuid;

use crate::domain::errors::referral_errors::ReferralError;
use crate::domain::models::referral::PayoutRunSummary;

#[async_trait]
pub trait ReferralService: 'static + Sync + Send {
    async fn record_referral(
        &self,
        referrer_id: Uuid,
        referred_id: Uuid,
    ) -> Result<(), ReferralError>;

    async fn direct_referral_count(
        &self,
        referrer_id: Uuid,
    ) -> Result<i64, ReferralError>;

    /// Pays the direct referrer once when the referred customer completes
    /// their first booking. Repeated status updates are safe.
    async fn award_for_completed_booking(
        &self,
        referred_user_id: Uuid,
        booking_id: Uuid,
    ) -> Result<(), ReferralError>;

    /// Walks the whole referral forest bottom-up and pays out the flat-rate
    /// cascade for `[period_start, period_end)`. Errors with
    /// `PayoutAlreadyRun` if this exact period was already processed.
    async fn run_monthly_payout(
        &self,
        period_start: DateTime<Utc>,
        period_end: DateTime<Utc>,
    ) -> Result<PayoutRunSummary, ReferralError>;
}
