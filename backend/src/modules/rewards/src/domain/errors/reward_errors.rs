use base::error::{ApiError, RepositoryError};
use base::response_code::ApiResponseCode;
use std::error::Error;
use std::fmt;

#[derive(Debug)]
pub enum RewardError {
    InvalidPoints,
    InternalServerError(RepositoryError),
}

impl fmt::Display for RewardError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            RewardError::InvalidPoints => {
                write!(f, "Points must be a non-zero number")
            }
            RewardError::InternalServerError(error) => {
                write!(
                    f,
                    "Internal Server Error(RewardError): {}",
                    &error.message
                )
            }
        }
    }
}

impl From<RewardError> for ApiError {
    fn from(value: RewardError) -> Self {
        let code = match value {
            RewardError::InvalidPoints => ApiResponseCode::BadRequest,
            RewardError::InternalServerError(_) => {
                ApiResponseCode::InternalServerError
            }
        };

        ApiError { message: value.to_string(), code: code.status_code() }
    }
}

impl Error for RewardError {}
