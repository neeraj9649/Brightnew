use async_trait::async_trait;
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use std::collections::HashMap;
use std::sync::Arc;
use uuid::Uuid;

use crate::domain::errors::reward_errors::RewardError;
use crate::domain::models::reward_transaction::{
    CreateRewardTransaction, RewardReason, RewardTransaction,
};
use crate::domain::points_config::{
    first_booking_bonus_points, points_for_booking_type, welcome_bonus_points,
};
use crate::domain::repositories::reward_transaction::RewardTransactionRepository;
use crate::domain::services::rewards::RewardsService;
use crate::infrastructure::repositories::reward_transaction::RewardTransactionSqlxRepository;

#[derive(Clone)]
pub struct RewardsServiceImpl {
    pub repository: Arc<dyn RewardTransactionRepository>,
    pub pool: PgPool,
}

impl RewardsServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self {
            repository: Arc::new(RewardTransactionSqlxRepository::new(pool.clone())),
            pool,
        }
    }
}

#[async_trait]
impl RewardsService for RewardsServiceImpl {
    async fn award(
        &self,
        user_id: Uuid,
        points: i32,
        reason: RewardReason,
        source_type: Option<String>,
        source_id: Option<Uuid>,
        description: Option<String>,
        created_by: Option<Uuid>,
    ) -> Result<RewardTransaction, RewardError> {
        if points == 0 {
            return Err(RewardError::InvalidPoints);
        }

        self.repository
            .create(&CreateRewardTransaction {
                user_id,
                points,
                reason,
                source_type,
                source_id,
                description,
                created_by,
            })
            .await
            .map_err(RewardError::InternalServerError)
    }

    async fn award_for_completed_booking(
        &self,
        user_id: Uuid,
        booking_id: Uuid,
        booking_type: &str,
    ) -> Result<Vec<RewardTransaction>, RewardError> {
        let already_has_booking_reward = self
            .repository
            .has_booking_reward(user_id)
            .await
            .map_err(RewardError::InternalServerError)?;

        let mut awarded = Vec::with_capacity(2);

        let booking_tx = self
            .award(
                user_id,
                points_for_booking_type(&self.pool, booking_type).await,
                RewardReason::Booking,
                Some(booking_type.to_string()),
                Some(booking_id),
                None,
                None,
            )
            .await?;
        awarded.push(booking_tx);

        if !already_has_booking_reward {
            let bonus_tx = self
                .award(
                    user_id,
                    first_booking_bonus_points(&self.pool).await,
                    RewardReason::FirstBooking,
                    Some(booking_type.to_string()),
                    Some(booking_id),
                    None,
                    None,
                )
                .await?;
            awarded.push(bonus_tx);
        }

        Ok(awarded)
    }

    async fn welcome_bonus(&self) -> i32 {
        welcome_bonus_points(&self.pool).await
    }

    async fn history(
        &self,
        user_id: Uuid,
    ) -> Result<Vec<RewardTransaction>, RewardError> {
        self.repository
            .list_for_user(user_id)
            .await
            .map_err(RewardError::InternalServerError)
    }

    async fn monthly_earned_totals(
        &self,
        period_start: DateTime<Utc>,
        period_end: DateTime<Utc>,
    ) -> Result<HashMap<Uuid, i64>, RewardError> {
        self.repository
            .sum_points_by_user_in_range(period_start, period_end)
            .await
            .map_err(RewardError::InternalServerError)
    }
}
