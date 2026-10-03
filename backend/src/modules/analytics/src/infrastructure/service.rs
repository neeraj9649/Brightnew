use async_trait::async_trait;
use sqlx::PgPool;

use crate::domain::errors::AnalyticsError;
use crate::domain::models::{
    AnalyticsOverview, CustomerAnalytics, EmployeePerformance, MonthlyCount,
    ReferralAnalytics, RevenueAnalytics, RevenueByMonth, RevenueByType, TierCount,
    TopReferrer,
};
use crate::domain::service::AnalyticsService;

pub struct AnalyticsServiceImpl {
    pub pool: PgPool,
}

impl AnalyticsServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

// Intermediate rows assembled into the public response structs below.
struct CustomerTotals {
    total: i64,
    new_this_month: i64,
}
struct ReferralTotals {
    total_referrals: i64,
    total_referral_points_paid: i64,
}

// ponytail: "revenue" = money on bookings that have reached/passed payment
// (status in payment_received | booking_confirmed | completed), inlined in each
// query below since sqlx query literals can't take a runtime string. Upgrade
// path: switch to the payment_status column if a stricter "paid" def is needed.

#[async_trait]
impl AnalyticsService for AnalyticsServiceImpl {
    async fn overview(&self) -> Result<AnalyticsOverview, AnalyticsError> {
        Ok(sqlx::query_as!(
            AnalyticsOverview,
            r#"
            SELECT
              (SELECT COUNT(*) FROM users WHERE role = 'customer')::bigint AS "total_customers!",
              (SELECT COUNT(*) FROM users WHERE role = 'employee')::bigint AS "total_employees!",
              (SELECT COUNT(*) FROM bookings)::bigint AS "total_bookings!",
              (SELECT COUNT(*) FROM bookings WHERE status NOT IN ('completed','cancelled'))::bigint AS "active_bookings!",
              (SELECT COUNT(*) FROM bookings WHERE status = 'completed')::bigint AS "completed_bookings!",
              (SELECT COALESCE(SUM(final_cost),0) FROM bookings WHERE status IN ('payment_received','booking_confirmed','completed'))::float8 AS "total_revenue!",
              (SELECT COALESCE(SUM(tokens),0) FROM users)::bigint AS "points_outstanding!",
              (SELECT COUNT(*) FROM referrals)::bigint AS "total_referrals!"
            "#
        )
        .fetch_one(&self.pool)
        .await?)
    }

    async fn revenue(&self) -> Result<RevenueAnalytics, AnalyticsError> {
        let by_type = sqlx::query_as!(
            RevenueByType,
            r#"
            SELECT type AS "service_type!",
                   COALESCE(SUM(final_cost),0)::float8 AS "revenue!",
                   COUNT(*)::bigint AS "bookings!"
            FROM bookings
            WHERE status IN ('payment_received','booking_confirmed','completed')
            GROUP BY type
            ORDER BY SUM(final_cost) DESC
            "#
        )
        .fetch_all(&self.pool)
        .await?;

        let monthly = sqlx::query_as!(
            RevenueByMonth,
            r#"
            SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS "month!",
                   COALESCE(SUM(final_cost),0)::float8 AS "revenue!",
                   COUNT(*)::bigint AS "bookings!"
            FROM bookings
            WHERE status IN ('payment_received','booking_confirmed','completed')
              AND created_at >= date_trunc('month', now()) - interval '11 months'
            GROUP BY date_trunc('month', created_at)
            ORDER BY date_trunc('month', created_at)
            "#
        )
        .fetch_all(&self.pool)
        .await?;

        let total_revenue = by_type.iter().map(|r| r.revenue).sum();
        Ok(RevenueAnalytics { total_revenue, by_type, monthly })
    }

    async fn customers(&self) -> Result<CustomerAnalytics, AnalyticsError> {
        let totals = sqlx::query_as!(
            CustomerTotals,
            r#"
            SELECT
              (SELECT COUNT(*) FROM users WHERE role='customer')::bigint AS "total!",
              (SELECT COUNT(*) FROM users WHERE role='customer' AND joined_at >= date_trunc('month', now()))::bigint AS "new_this_month!"
            "#
        )
        .fetch_one(&self.pool)
        .await?;

        let monthly_signups = sqlx::query_as!(
            MonthlyCount,
            r#"
            SELECT to_char(date_trunc('month', joined_at), 'YYYY-MM') AS "month!",
                   COUNT(*)::bigint AS "count!"
            FROM users
            WHERE role='customer'
              AND joined_at >= date_trunc('month', now()) - interval '11 months'
            GROUP BY date_trunc('month', joined_at)
            ORDER BY date_trunc('month', joined_at)
            "#
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(CustomerAnalytics {
            total: totals.total,
            new_this_month: totals.new_this_month,
            monthly_signups,
        })
    }

    async fn membership(&self) -> Result<Vec<TierCount>, AnalyticsError> {
        Ok(sqlx::query_as!(
            TierCount,
            r#"
            SELECT membership_tier AS "tier!", COUNT(*)::bigint AS "count!"
            FROM users
            WHERE role='customer'
            GROUP BY membership_tier
            ORDER BY COUNT(*) DESC
            "#
        )
        .fetch_all(&self.pool)
        .await?)
    }

    async fn referral(&self) -> Result<ReferralAnalytics, AnalyticsError> {
        let totals = sqlx::query_as!(
            ReferralTotals,
            r#"
            SELECT
              (SELECT COUNT(*) FROM referrals)::bigint AS "total_referrals!",
              (SELECT COALESCE(SUM(points),0) FROM reward_transactions WHERE reason='referral')::bigint AS "total_referral_points_paid!"
            "#
        )
        .fetch_one(&self.pool)
        .await?;

        let top_referrers = sqlx::query_as!(
            TopReferrer,
            r#"
            SELECT u.id AS "user_id!",
                   (u.first_name || ' ' || COALESCE(u.last_name, '')) AS "name!",
                   COUNT(r.id)::bigint AS "referral_count!"
            FROM referrals r
            JOIN users u ON u.id = r.referrer_id
            GROUP BY u.id, u.first_name, u.last_name
            ORDER BY COUNT(r.id) DESC
            LIMIT 10
            "#
        )
        .fetch_all(&self.pool)
        .await?;

        Ok(ReferralAnalytics {
            total_referrals: totals.total_referrals,
            total_referral_points_paid: totals.total_referral_points_paid,
            top_referrers,
        })
    }

    async fn employees(&self) -> Result<Vec<EmployeePerformance>, AnalyticsError> {
        Ok(sqlx::query_as!(
            EmployeePerformance,
            r#"
            SELECT u.id AS "user_id!",
                   (u.first_name || ' ' || COALESCE(u.last_name, '')) AS "name!",
                   (SELECT COUNT(*) FROM bookings b WHERE b.assigned_employee_id = u.id)::bigint AS "assigned!",
                   (SELECT COUNT(*) FROM bookings b WHERE b.assigned_employee_id = u.id AND b.status = 'completed')::bigint AS "completed!",
                   (SELECT COUNT(*) FROM tasks t WHERE t.assigned_to = u.id AND t.status = 'pending')::bigint AS "open_tasks!"
            FROM users u
            WHERE u.role IN ('employee','admin')
            ORDER BY (SELECT COUNT(*) FROM bookings b WHERE b.assigned_employee_id = u.id) DESC
            "#
        )
        .fetch_all(&self.pool)
        .await?)
    }
}
