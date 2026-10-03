use base::error::{ApiError, RepositoryError};
use base::response_code::ApiResponseCode;
use std::error::Error;
use std::fmt;

#[derive(Debug)]
pub enum CrmError {
    NotFound,
    InvalidInput(String),
    InternalServerError(RepositoryError),
}

impl fmt::Display for CrmError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CrmError::NotFound => write!(f, "Not found"),
            CrmError::InvalidInput(message) => write!(f, "{}", message),
            CrmError::InternalServerError(error) => {
                write!(f, "Internal Server Error(CrmError): {}", &error.message)
            }
        }
    }
}

impl From<CrmError> for ApiError {
    fn from(value: CrmError) -> Self {
        let code = match value {
            CrmError::NotFound => ApiResponseCode::NotFound,
            CrmError::InvalidInput(_) => ApiResponseCode::BadRequest,
            CrmError::InternalServerError(_) => {
                ApiResponseCode::InternalServerError
            }
        };

        ApiError { message: value.to_string(), code: code.status_code() }
    }
}

impl Error for CrmError {}
