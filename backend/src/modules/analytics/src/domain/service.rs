use async_trait::async_trait;

use crate::domain::errors::AnalyticsError;
use crate::domain::models::{
    AnalyticsOverview, CustomerAnalytics, EmployeePerformance, ReferralAnalytics,
    RevenueAnalytics, TierCount,
};

#[async_trait]
pub trait AnalyticsService: 'static + Sync + Send {
    async fn overview(&self) -> Result<AnalyticsOverview, AnalyticsError>;
    async fn revenue(&self) -> Result<RevenueAnalytics, AnalyticsError>;
    async fn customers(&self) -> Result<CustomerAnalytics, AnalyticsError>;
    async fn membership(&self) -> Result<Vec<TierCount>, AnalyticsError>;
    async fn referral(&self) -> Result<ReferralAnalytics, AnalyticsError>;
    async fn employees(&self) -> Result<Vec<EmployeePerformance>, AnalyticsError>;
}
