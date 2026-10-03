use base::error::{ApiError, RepositoryError};
use base::response_code::ApiResponseCode;
use std::error::Error;
use std::fmt;

#[derive(Debug)]
pub enum ReferralError {
    InvalidReferralCode,
    PayoutAlreadyRun,
    InternalServerError(RepositoryError),
}

impl fmt::Display for ReferralError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ReferralError::InvalidReferralCode => {
                write!(f, "Invalid referral code")
            }
            ReferralError::PayoutAlreadyRun => {
                write!(f, "Referral payout has already run for this period")
            }
            ReferralError::InternalServerError(error) => {
                write!(
                    f,
                    "Internal Server Error(ReferralError): {}",
                    &error.message
                )
            }
        }
    }
}

impl From<ReferralError> for ApiError {
    fn from(value: ReferralError) -> Self {
        let code = match value {
            ReferralError::InvalidReferralCode => ApiResponseCode::BadRequest,
            ReferralError::PayoutAlreadyRun => ApiResponseCode::Conflict,
            ReferralError::InternalServerError(_) => {
                ApiResponseCode::InternalServerError
            }
        };

        ApiError { message: value.to_string(), code: code.status_code() }
    }
}

impl Error for ReferralError {}
