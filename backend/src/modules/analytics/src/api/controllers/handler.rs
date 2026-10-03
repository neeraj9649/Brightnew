use actix_web::web;
use base::error::{ApiError, ApiResponse};

use crate::domain::models::{
    AnalyticsOverview, CustomerAnalytics, EmployeePerformance, ReferralAnalytics,
    RevenueAnalytics, TierCount,
};
use crate::domain::service::AnalyticsService;

pub async fn overview_handler(
    svc: web::Data<dyn AnalyticsService>,
) -> Result<ApiResponse<AnalyticsOverview>, ApiError> {
    Ok(ApiResponse(svc.overview().await?))
}

pub async fn revenue_handler(
    svc: web::Data<dyn AnalyticsService>,
) -> Result<ApiResponse<RevenueAnalytics>, ApiError> {
    Ok(ApiResponse(svc.revenue().await?))
}

pub async fn customers_handler(
    svc: web::Data<dyn AnalyticsService>,
) -> Result<ApiResponse<CustomerAnalytics>, ApiError> {
    Ok(ApiResponse(svc.customers().await?))
}

pub async fn membership_handler(
    svc: web::Data<dyn AnalyticsService>,
) -> Result<ApiResponse<Vec<TierCount>>, ApiError> {
    Ok(ApiResponse(svc.membership().await?))
}

pub async fn referral_handler(
    svc: web::Data<dyn AnalyticsService>,
) -> Result<ApiResponse<ReferralAnalytics>, ApiError> {
    Ok(ApiResponse(svc.referral().await?))
}

pub async fn employees_handler(
    svc: web::Data<dyn AnalyticsService>,
) -> Result<ApiResponse<Vec<EmployeePerformance>>, ApiError> {
    Ok(ApiResponse(svc.employees().await?))
}
