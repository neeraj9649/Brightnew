use base::error::{ApiError, RepositoryError};
use base::response_code::ApiResponseCode;
use std::error::Error;
use std::fmt;

#[derive(Debug)]
pub enum BookingError {
    BookingDoesNotExist,
    BookingNotOwnedByUser,
    BookingNotAssignedToEmployee,
    InvalidBookingType,
    InternalServerError(RepositoryError),
}

impl fmt::Display for BookingError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            BookingError::BookingDoesNotExist => {
                write!(f, "Booking Fetching Error: Does Not Exist")
            }
            BookingError::BookingNotOwnedByUser => {
                write!(f, "Booking Not Authorised")
            }
            BookingError::BookingNotAssignedToEmployee => {
                write!(f, "This booking is not assigned to you")
            }
            BookingError::InvalidBookingType => {
                write!(f, "Invalid booking type")
            }
            BookingError::InternalServerError(error) => {
                write!(
                    f,
                    "Internal Server Error(BookingError): {}",
                    &error.message
                )
            }
        }
    }
}

impl From<BookingError> for ApiError {
    fn from(value: BookingError) -> Self {
        let code = match value {
            BookingError::BookingNotOwnedByUser => ApiResponseCode::Forbidden,
            BookingError::BookingNotAssignedToEmployee => {
                ApiResponseCode::Forbidden
            }
            BookingError::BookingDoesNotExist => ApiResponseCode::NotFound,
            BookingError::InvalidBookingType => ApiResponseCode::BadRequest,
            BookingError::InternalServerError(_) => {
                ApiResponseCode::InternalServerError
            }
        };

        ApiError { message: value.to_string(), code: code.status_code() }
    }
}

impl Error for BookingError {}
