use serde::Serialize;
use uuid::Uuid;

// ponytail: analytics is read-only projections, so these Serialize structs ARE
// the transport shape -- no separate domain/DTO/mapper layer like the write
// modules (there's nothing to map). Money sums are cast to ::float8 in SQL so
// they land here as plain f64 (clean JSON numbers, no BigDecimal dep).

#[derive(Debug, Serialize)]
pub struct AnalyticsOverview {
    pub total_customers: i64,
    pub total_employees: i64,
    pub total_bookings: i64,
    pub active_bookings: i64,
    pub completed_bookings: i64,
    pub total_revenue: f64,
    pub points_outstanding: i64,
    pub total_referrals: i64,
}

#[derive(Debug, Serialize)]
pub struct RevenueByType {
    #[serde(rename = "type")]
    pub service_type: String,
    pub revenue: f64,
    pub bookings: i64,
}

#[derive(Debug, Serialize)]
pub struct RevenueByMonth {
    pub month: String,
    pub revenue: f64,
    pub bookings: i64,
}

#[derive(Debug, Serialize)]
pub struct RevenueAnalytics {
    pub total_revenue: f64,
    pub by_type: Vec<RevenueByType>,
    pub monthly: Vec<RevenueByMonth>,
}

#[derive(Debug, Serialize)]
pub struct MonthlyCount {
    pub month: String,
    pub count: i64,
}

#[derive(Debug, Serialize)]
pub struct CustomerAnalytics {
    pub total: i64,
    pub new_this_month: i64,
    pub monthly_signups: Vec<MonthlyCount>,
}

#[derive(Debug, Serialize)]
pub struct TierCount {
    pub tier: String,
    pub count: i64,
}

#[derive(Debug, Serialize)]
pub struct TopReferrer {
    pub user_id: Uuid,
    pub name: String,
    pub referral_count: i64,
}

#[derive(Debug, Serialize)]
pub struct ReferralAnalytics {
    pub total_referrals: i64,
    pub total_referral_points_paid: i64,
    pub top_referrers: Vec<TopReferrer>,
}

#[derive(Debug, Serialize)]
pub struct EmployeePerformance {
    pub user_id: Uuid,
    pub name: String,
    pub assigned: i64,
    pub completed: i64,
    pub open_tasks: i64,
}
