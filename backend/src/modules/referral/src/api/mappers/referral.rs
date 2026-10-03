use crate::api::dto::referral::PayoutRunResultDTO;
use crate::domain::models::referral::PayoutRunSummary;

impl From<PayoutRunSummary> for PayoutRunResultDTO {
    fn from(value: PayoutRunSummary) -> Self {
        Self {
            period_start: value.period_start,
            period_end: value.period_end,
            users_paid: value.users_paid,
            total_points_paid: value.total_points_paid,
        }
    }
}
