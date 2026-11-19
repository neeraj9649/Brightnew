use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

use super::user::UserDTO;

#[derive(Debug, Deserialize)]
pub struct RegisterRequestDTO {
    pub phone: String,
    /// The 6-digit code sent to `phone` by `POST /auth/otp/request` with purpose "register".
    pub code: String,
    /// The 4-digit passcode the member chose; used to sign in from now on.
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
    /// Optional: enrollment is phone + one-time code in the customer portal.
    /// Staff may still provide a date when it is useful for the itinerary.
    #[serde(default)]
    pub date_of_birth: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequestDTO {
    pub phone: String,
    /// The member's 4-digit passcode.
    pub pin: String,
}

/// Forgot passcode: prove the phone with a code (purpose "reset"), then set a new passcode.
#[derive(Debug, Deserialize)]
pub struct ResetPinRequestDTO {
    pub phone: String,
    pub code: String,
    pub pin: String,
}

#[derive(Debug, Deserialize)]
pub struct OtpRequestDTO {
    pub phone: String,
    /// "register" (the number must be new) or "reset" (forgot passcode; the account must exist).
    pub purpose: String,
    /// Register only: the referral or staff code the member typed, checked before sending.
    #[serde(default)]
    pub referred_by_code: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct AuthResponseDTO {
    pub access_token: String,
    pub user: UserDTO,
}
