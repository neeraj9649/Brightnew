use async_trait::async_trait;
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use std::collections::{HashMap, HashSet, VecDeque};
use std::sync::Arc;
use uuid::Uuid;

use crate::domain::errors::referral_errors::ReferralError;
use crate::domain::models::referral::PayoutRunSummary;
use crate::domain::rate_config::referral_rate_percent;
use crate::domain::repositories::referral::ReferralRepository;
use crate::domain::services::referral::ReferralService;
use crate::infrastructure::repositories::referral::ReferralSqlxRepository;
use base::error::RepositoryError;
use rewards::domain::models::reward_transaction::RewardReason;
use rewards::domain::services::rewards::RewardsService;

#[derive(Clone)]
pub struct ReferralServiceImpl {
    pub repository: Arc<dyn ReferralRepository>,
    pub rewards_service: Arc<dyn RewardsService>,
}

impl ReferralServiceImpl {
    pub fn new(pool: PgPool, rewards_service: Arc<dyn RewardsService>) -> Self {
        Self {
            repository: Arc::new(ReferralSqlxRepository::new(pool)),
            rewards_service,
        }
    }
}

#[async_trait]
impl ReferralService for ReferralServiceImpl {
    async fn record_referral(
        &self,
        referrer_id: Uuid,
        referred_id: Uuid,
    ) -> Result<(), ReferralError> {
        self.repository
            .create(referrer_id, referred_id)
            .await
            .map(|_| ())
            .map_err(ReferralError::InternalServerError)
    }

    async fn direct_referral_count(
        &self,
        referrer_id: Uuid,
    ) -> Result<i64, ReferralError> {
        self.repository
            .count_direct_referrals(referrer_id)
            .await
            .map_err(ReferralError::InternalServerError)
    }

    async fn award_for_completed_booking(
        &self,
        referred_user_id: Uuid,
        _booking_id: Uuid,
    ) -> Result<(), ReferralError> {
        let Some(referrer_id) = self
            .repository
            .referrer_of(referred_user_id)
            .await
            .map_err(ReferralError::InternalServerError)?
        else {
            return Ok(());
        };

        let points = self.rewards_service.referral_bonus().await;
        self.rewards_service
            .award_referral_once(
                referrer_id,
                referred_user_id,
                points,
                Some("Referral bonus for a friend's first completed booking".to_string()),
            )
            .await
            .map_err(|err| ReferralError::InternalServerError(RepositoryError::new(err.to_string())))?;
        Ok(())
    }

    async fn run_monthly_payout(
        &self,
        period_start: DateTime<Utc>,
        period_end: DateTime<Utc>,
    ) -> Result<PayoutRunSummary, ReferralError> {
        // Reserved before any payout is applied, so a duplicate call for the
        // same period fails fast here instead of double-paying everyone.
        self.repository
            .reserve_payout_run(period_start, period_end)
            .await
            .map_err(|err| {
                if err.message.contains("referral_payout_runs") {
                    ReferralError::PayoutAlreadyRun
                } else {
                    ReferralError::InternalServerError(err)
                }
            })?;

        let edges = self
            .repository
            .all_edges()
            .await
            .map_err(ReferralError::InternalServerError)?;

        let own_earned = self
            .rewards_service
            .monthly_earned_totals(period_start, period_end)
            .await
            .map_err(|err| {
                ReferralError::InternalServerError(RepositoryError::new(err.to_string()))
            })?;

        let rate = referral_rate_percent();

        // ponytail: loads the whole referral forest + this month's point
        // deltas into memory and walks it with one pass of in-process
        // topological peeling (no recursive SQL, no per-node DB round trip).
        // Fine into the tens-of-thousands of referral edges; move to a
        // chunked/streaming pass if this table gets far bigger than that.
        let mut referrer_of: HashMap<Uuid, Uuid> = HashMap::new();
        let mut remaining_children: HashMap<Uuid, usize> = HashMap::new();
        let mut all_nodes: HashSet<Uuid> = HashSet::new();
        for (referred_id, referrer_id) in &edges {
            referrer_of.insert(*referred_id, *referrer_id);
            *remaining_children.entry(*referrer_id).or_insert(0) += 1;
            all_nodes.insert(*referred_id);
            all_nodes.insert(*referrer_id);
        }

        let mut ready: VecDeque<Uuid> = all_nodes
            .iter()
            .copied()
            .filter(|node| remaining_children.get(node).copied().unwrap_or(0) == 0)
            .collect();

        let mut referral_points_earned: HashMap<Uuid, i64> = HashMap::new();
        let mut processed: HashSet<Uuid> = HashSet::new();
        let max_iterations = all_nodes.len();
        let mut iterations = 0usize;

        while let Some(node) = ready.pop_front() {
            if processed.contains(&node) {
                continue;
            }
            iterations += 1;
            if iterations > max_iterations {
                break; // defensive: a real forest can never need more steps than it has nodes
            }
            processed.insert(node);

            let own = own_earned.get(&node).copied().unwrap_or(0);
            let received = referral_points_earned.get(&node).copied().unwrap_or(0);
            let total = own + received;

            if let Some(referrer_id) = referrer_of.get(&node).copied() {
                if total > 0 {
                    let bonus = ((total as f64) * rate / 100.0).round() as i64;
                    if bonus > 0 {
                        *referral_points_earned.entry(referrer_id).or_insert(0) += bonus;
                    }
                }
                if let Some(count) = remaining_children.get_mut(&referrer_id) {
                    *count -= 1;
                    if *count == 0 {
                        ready.push_back(referrer_id);
                    }
                }
            }
        }

        let mut total_points_paid: i64 = 0;
        let mut users_paid: i32 = 0;
        for (referrer_id, bonus) in referral_points_earned.into_iter() {
            if bonus <= 0 {
                continue;
            }
            self.rewards_service
                .award(
                    referrer_id,
                    bonus as i32,
                    RewardReason::Referral,
                    Some("monthly_referral".to_string()),
                    None,
                    Some(format!(
                        "Referral bonus for {}",
                        period_start.format("%Y-%m")
                    )),
                    None,
                )
                .await
                .map_err(|err| {
                    ReferralError::InternalServerError(RepositoryError::new(err.to_string()))
                })?;
            total_points_paid += bonus;
            users_paid += 1;
        }

        self.repository
            .finalize_payout_run(period_start, period_end, users_paid, total_points_paid)
            .await
            .map_err(ReferralError::InternalServerError)?;

        Ok(PayoutRunSummary { period_start, period_end, users_paid, total_points_paid })
    }
}
