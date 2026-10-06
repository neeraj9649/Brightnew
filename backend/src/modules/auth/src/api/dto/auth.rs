use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

use super::user::UserDTO;

#[derive(Debug, Deserialize)]
pub struct RegisterRequestDTO {
    pub phone: String,
    pub pin: String,
    pub first_name: String,
    #[serde(default)]
    pub last_name: Option<String>,
    /// Optional fallback contact channel; not used for login.
    #[serde(default)]
    pub email: Option<String>,
    /// The referrer's `referral_code`, if this signup came from a referral.
    #[serde(default)]
    pub referred_by_code: Option<String>,
    /// Optional: enrollment is phone + 4-digit PIN in the customer portal.
    /// Staff may still provide a date when it is useful for the itinerary.
    #[serde(default)]
    pub date_of_birth: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequestDTO {
    pub phone: String,
    pub pin: String,
}

#[derive(Debug, Serialize)]
pub struct AuthResponseDTO {
    pub access_token: String,
    pub user: UserDTO,
}
