use async_trait::async_trait;
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use std::collections::HashMap;
use uuid::Uuid;

use crate::domain::models::reward_transaction::{
    CreateRewardTransaction, RewardReason, RewardTransaction,
};
use crate::domain::repositories::reward_transaction::RewardTransactionRepository;
use crate::domain::tier_config::{tier_for_lifetime_points, tier_rank};
use base::result_paging::RepositoryResult;

pub struct RewardTransactionSqlxRepository {
    pub pool: PgPool,
}

impl RewardTransactionSqlxRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl RewardTransactionRepository for RewardTransactionSqlxRepository {
    async fn create(
        &self,
        new_transaction: &CreateRewardTransaction,
    ) -> RepositoryResult<RewardTransaction> {
        let mut tx = self.pool.begin().await?;

        // Lifetime counter tracks *earning* only: redemption rows (both the
        // debit and any refund credit) never touch it, and every other reason
        // only ever adds. So a tier earned by spending Wings is never lost, and
        // a cancelled redemption's refund doesn't inflate it either.
        let lifetime_delta = if new_transaction.reason == RewardReason::Redemption {
            0
        } else {
            new_transaction.points.max(0) as i64
        };
        let updated = sqlx::query!(
            r#"
            UPDATE users
            SET tokens = tokens + $1,
                lifetime_points_earned = lifetime_points_earned + $2
            WHERE id = $3
            RETURNING lifetime_points_earned, membership_tier
            "#,
            new_transaction.points,
            lifetime_delta,
            new_transaction.user_id
        )
        .fetch_one(&mut *tx)
        .await?;

        let target_tier = tier_for_lifetime_points(updated.lifetime_points_earned);
        if tier_rank(target_tier) > tier_rank(&updated.membership_tier) {
            sqlx::query!(
                "UPDATE users SET membership_tier = $1 WHERE id = $2",
                target_tier,
                new_transaction.user_id
            )
            .execute(&mut *tx)
            .await?;
        }

        let transaction = sqlx::query_as!(
            RewardTransaction,
            r#"
            INSERT INTO reward_transactions
                (id, user_id, points, reason, source_type, source_id,
                 description, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, user_id, points, reason, source_type, source_id,
                description, created_by, created_at
            "#,
            Uuid::new_v4(),
            new_transaction.user_id,
            new_transaction.points,
            new_transaction.reason.as_str(),
            new_transaction.source_type,
            new_transaction.source_id,
            new_transaction.description,
            new_transaction.created_by
        )
        .fetch_one(&mut *tx)
        .await?;

        tx.commit().await?;
        Ok(transaction)
    }

    async fn list_for_user(
        &self,
        user_id: Uuid,
    ) -> RepositoryResult<Vec<RewardTransaction>> {
        Ok(sqlx::query_as!(
            RewardTransaction,
            r#"
            SELECT id, user_id, points, reason, source_type, source_id,
                description, created_by, created_at
            FROM reward_transactions WHERE user_id = $1 ORDER BY created_at DESC
            "#,
            user_id
        )
        .fetch_all(&self.pool)
        .await?)
    }

    async fn has_booking_reward(&self, user_id: Uuid) -> RepositoryResult<bool> {
        let row = sqlx::query!(
            r#"
            SELECT EXISTS(
                SELECT 1 FROM reward_transactions
                WHERE user_id = $1 AND reason IN ('booking', 'first_booking')
            ) AS "has_reward!"
            "#,
            user_id
        )
        .fetch_one(&self.pool)
        .await?;
        Ok(row.has_reward)
    }

    async fn sum_points_by_user_in_range(
        &self,
        period_start: DateTime<Utc>,
        period_end: DateTime<Utc>,
    ) -> RepositoryResult<HashMap<Uuid, i64>> {
        let rows = sqlx::query!(
            r#"
            SELECT user_id, SUM(points)::bigint AS "total!"
            FROM reward_transactions
            WHERE created_at >= $1 AND created_at < $2
            GROUP BY user_id
            "#,
            period_start,
            period_end
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|row| (row.user_id, row.total)).collect())
    }
}
