use async_trait::async_trait;
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::models::referral::Referral;
use crate::domain::repositories::referral::ReferralRepository;
use base::result_paging::RepositoryResult;

pub struct ReferralSqlxRepository {
    pub pool: PgPool,
}

impl ReferralSqlxRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl ReferralRepository for ReferralSqlxRepository {
    async fn create(
        &self,
        referrer_id: Uuid,
        referred_id: Uuid,
    ) -> RepositoryResult<Referral> {
        Ok(sqlx::query_as!(
            Referral,
            r#"
            INSERT INTO referrals (id, referrer_id, referred_id)
            VALUES ($1, $2, $3)
            RETURNING id, referrer_id, referred_id, created_at
            "#,
            Uuid::new_v4(),
            referrer_id,
            referred_id
        )
        .fetch_one(&self.pool)
        .await?)
    }

    async fn all_edges(&self) -> RepositoryResult<Vec<(Uuid, Uuid)>> {
        let rows = sqlx::query!("SELECT referred_id, referrer_id FROM referrals")
            .fetch_all(&self.pool)
            .await?;
        Ok(rows.into_iter().map(|r| (r.referred_id, r.referrer_id)).collect())
    }

    async fn referrer_of(&self, user_id: Uuid) -> RepositoryResult<Option<Uuid>> {
        let row = sqlx::query!(
            "SELECT referrer_id FROM referrals WHERE referred_id = $1",
            user_id
        )
        .fetch_optional(&self.pool)
        .await?;
        Ok(row.map(|r| r.referrer_id))
    }

    async fn count_direct_referrals(&self, referrer_id: Uuid) -> RepositoryResult<i64> {
        let row = sqlx::query!(
            r#"SELECT COUNT(*) AS "count!" FROM referrals WHERE referrer_id = $1"#,
            referrer_id
        )
        .fetch_one(&self.pool)
        .await?;
        Ok(row.count)
    }

    async fn reserve_payout_run(
        &self,
        period_start: DateTime<Utc>,
        period_end: DateTime<Utc>,
    ) -> RepositoryResult<()> {
        sqlx::query!(
            r#"
            INSERT INTO referral_payout_runs
                (id, period_start, period_end, users_paid, total_points_paid)
            VALUES ($1, $2, $3, 0, 0)
            "#,
            Uuid::new_v4(),
            period_start,
            period_end
        )
        .execute(&self.pool)
        .await?;
        Ok(())
    }

    async fn finalize_payout_run(
        &self,
        period_start: DateTime<Utc>,
        period_end: DateTime<Utc>,
        users_paid: i32,
        total_points_paid: i64,
    ) -> RepositoryResult<()> {
        sqlx::query!(
            r#"
            UPDATE referral_payout_runs
            SET users_paid = $3, total_points_paid = $4
            WHERE period_start = $1 AND period_end = $2
            "#,
            period_start,
            period_end,
            users_paid,
            total_points_paid
        )
        .execute(&self.pool)
        .await?;
        Ok(())
    }
}
