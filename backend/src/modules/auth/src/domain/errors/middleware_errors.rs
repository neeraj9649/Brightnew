use base::error::ApiError;
use base::response_code::ApiResponseCode;
use std::error::Error;
use std::fmt;

#[derive(Debug)]
pub enum MiddlewareError<'a> {
    Forbidden,
    InternalServerError(&'a str),
}

impl fmt::Display for MiddlewareError<'_> {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            MiddlewareError::Forbidden => write!(f, "Forbidden"),
            MiddlewareError::InternalServerError(error) => {
                write!(f, "Internal Server Error(MiddlewareError): {}", error)
            }
        }
    }
}

impl From<MiddlewareError<'_>> for ApiError {
    fn from(value: MiddlewareError) -> Self {
        let code = match value {
            MiddlewareError::Forbidden => ApiResponseCode::Forbidden,
            MiddlewareError::InternalServerError(_) => {
                ApiResponseCode::InternalServerError
            }
        };

        ApiError { message: value.to_string(), code: code.status_code() }
    }
}

impl Error for MiddlewareError<'_> {}
