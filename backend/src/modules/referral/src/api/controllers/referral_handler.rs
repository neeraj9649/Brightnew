use actix_web::web;
use base::error::{ApiError, ApiResponse};
use chrono::{TimeZone, Utc};

use crate::api::dto::referral::{PayoutRunResultDTO, RunMonthlyPayoutDTO};
use crate::domain::services::referral::ReferralService;

/// Runs the flat-rate cascading payout for a calendar month. There is no
/// in-process scheduler -- wire this to an external cron/systemd timer to
/// run automatically at month-end; for now it's admin-triggered.
pub async fn admin_run_monthly_payout_handler(
    referral_service: web::Data<dyn ReferralService>,
    body: web::Json<RunMonthlyPayoutDTO>,
) -> Result<ApiResponse<PayoutRunResultDTO>, ApiError> {
    let body = body.into_inner();

    let period_start = Utc
        .with_ymd_and_hms(body.year, body.month, 1, 0, 0, 0)
        .single()
        .ok_or_else(|| ApiError::new("Invalid year/month", 400))?;
    let (next_year, next_month) =
        if body.month == 12 { (body.year + 1, 1) } else { (body.year, body.month + 1) };
    let period_end = Utc
        .with_ymd_and_hms(next_year, next_month, 1, 0, 0, 0)
        .single()
        .ok_or_else(|| ApiError::new("Invalid year/month", 400))?;

    let summary =
        referral_service.run_monthly_payout(period_start, period_end).await?;
    Ok(ApiResponse(summary.into()))
}
