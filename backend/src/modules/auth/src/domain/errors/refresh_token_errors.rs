use base::error::{ApiError, RepositoryError};
use base::response_code::ApiResponseCode;
use std::error::Error;
use std::fmt;

#[derive(Debug)]
pub enum RefreshTokenError {
    RefreshTokenDoesNotExist,
    JwtTokenDoesNotExist,
    TokenExpired,
    InvalidTokenFormat,
    InvalidToken,
    InternalServerError(RepositoryError),
}

impl fmt::Display for RefreshTokenError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            RefreshTokenError::RefreshTokenDoesNotExist => {
                write!(f, "RefreshToken Fetching Error: Does Not Exist")
            }
            RefreshTokenError::JwtTokenDoesNotExist => {
                write!(f, "JwtToken Fetching Error: Does Not Exist")
            }
            RefreshTokenError::TokenExpired => write!(f, "TokenExpired"),
            RefreshTokenError::InvalidTokenFormat => {
                write!(f, "Invalid Token Format")
            }
            RefreshTokenError::InvalidToken => write!(f, "Invalid Token"),
            RefreshTokenError::InternalServerError(error) => {
                write!(
                    f,
                    "Internal Server Error(RefreshTokenError): {}",
                    &error.message
                )
            }
        }
    }
}

impl From<RefreshTokenError> for ApiError {
    fn from(value: RefreshTokenError) -> Self {
        let code = match value {
            RefreshTokenError::RefreshTokenDoesNotExist => {
                ApiResponseCode::Unauthorized
            }
            RefreshTokenError::JwtTokenDoesNotExist => {
                ApiResponseCode::Unauthorized
            }
            RefreshTokenError::TokenExpired => ApiResponseCode::Unauthorized,
            RefreshTokenError::InvalidTokenFormat => {
                ApiResponseCode::Unauthorized
            }
            RefreshTokenError::InvalidToken => ApiResponseCode::Unauthorized,
            RefreshTokenError::InternalServerError(_) => {
                ApiResponseCode::InternalServerError
            }
        };

        ApiError { message: value.to_string(), code: code.status_code() }
    }
}

impl Error for RefreshTokenError {}
