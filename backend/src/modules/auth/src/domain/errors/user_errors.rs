use base::error::{ApiError, RepositoryError};
use base::response_code::ApiResponseCode;
use std::error::Error;
use std::fmt;

#[derive(Debug)]
pub enum UserError {
    UserAlreadyExists,
    DuplicateHrCode,
    UserDoesNotExist,
    InvalidCredentials,
    InvalidPinFormat,
    InvalidPhoneFormat,
    InvalidReferralCode,
    UserNotAuthorised,
    InternalServerError(RepositoryError),
}

impl fmt::Display for UserError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            UserError::UserDoesNotExist => {
                write!(f, "User Fetching Error: Does Not Exist")
            }
            UserError::UserAlreadyExists => {
                write!(f, "User Creation Error: Phone Already Registered")
            }
            UserError::DuplicateHrCode => {
                write!(f, "User Creation Error: HR Code Already In Use")
            }
            UserError::InvalidCredentials => {
                write!(f, "Invalid phone number or PIN")
            }
            UserError::InvalidPinFormat => {
                write!(f, "PIN must be exactly 4 digits")
            }
            UserError::InvalidPhoneFormat => {
                write!(f, "Phone number must contain 5 to 20 digits")
            }
            UserError::InvalidReferralCode => {
                write!(f, "Invalid referral code")
            }
            UserError::UserNotAuthorised => {
                write!(f, "User Not Authorised")
            }
            UserError::InternalServerError(error) => {
                write!(f, "Internal Server Error(UserError): {}", &error.message)
            }
        }
    }
}

impl From<UserError> for ApiError {
    fn from(value: UserError) -> Self {
        let code = match value {
            UserError::UserNotAuthorised => ApiResponseCode::Forbidden,
            UserError::UserDoesNotExist => ApiResponseCode::NotFound,
            UserError::UserAlreadyExists => ApiResponseCode::Conflict,
            UserError::DuplicateHrCode => ApiResponseCode::Conflict,
            UserError::InvalidCredentials => ApiResponseCode::Unauthorized,
            UserError::InvalidPinFormat => ApiResponseCode::BadRequest,
            UserError::InvalidPhoneFormat => ApiResponseCode::BadRequest,
            UserError::InvalidReferralCode => ApiResponseCode::BadRequest,
            UserError::InternalServerError(_) => {
                ApiResponseCode::InternalServerError
            }
        };

        ApiError { message: value.to_string(), code: code.status_code() }
    }
}

impl Error for UserError {}
