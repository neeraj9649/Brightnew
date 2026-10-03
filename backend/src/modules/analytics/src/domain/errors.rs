use base::error::{ApiError, RepositoryError};
use std::error::Error;
use std::fmt;

#[derive(Debug)]
pub enum AnalyticsError {
    InternalServerError(RepositoryError),
}

impl fmt::Display for AnalyticsError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AnalyticsError::InternalServerError(error) => {
                write!(f, "Internal Server Error(AnalyticsError): {}", &error.message)
            }
        }
    }
}

impl From<sqlx::Error> for AnalyticsError {
    fn from(value: sqlx::Error) -> Self {
        AnalyticsError::InternalServerError(RepositoryError::new(value.to_string()))
    }
}

impl From<AnalyticsError> for ApiError {
    fn from(value: AnalyticsError) -> Self {
        ApiError { message: value.to_string(), code: 500 }
    }
}

impl Error for AnalyticsError {}
