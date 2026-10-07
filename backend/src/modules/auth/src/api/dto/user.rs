use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct UserDTO {
    pub id: Uuid,
    pub phone: String,
    pub email: Option<String>,
    pub first_name: String,
    pub last_name: Option<String>,
    pub role: String,
    pub is_active: bool,
    pub membership_tier: String,
    pub membership_code: String,
    pub referral_code: Option<String>,
    pub hr_code: Option<String>,
    pub tokens: i32,
    pub lifetime_points_earned: i64,
    pub total_bookings: i32,
    pub total_spent: f64,
    pub profile_image_url: Option<String>,
    pub date_of_birth: Option<NaiveDate>,
    pub joined_at: DateTime<Utc>,
    pub last_active: DateTime<Utc>,
}

#[derive(Debug, Default, Deserialize)]
pub struct UpdateProfileDTO {
    #[serde(default)]
    pub first_name: Option<String>,
    #[serde(default)]
    pub last_name: Option<String>,
    #[serde(default)]
    pub phone: Option<String>,
    #[serde(default)]
    pub profile_image_file_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct AdminUpdateUserDTO {
    pub id: Uuid,
    #[serde(default)]
    pub first_name: Option<String>,
    #[serde(default)]
    pub last_name: Option<String>,
    #[serde(default)]
    pub phone: Option<String>,
    /// One of "customer", "employee", "admin".
    #[serde(default)]
    pub role: Option<String>,
    #[serde(default)]
    pub is_active: Option<bool>,
    #[serde(default)]
    pub membership_tier: Option<String>,
}

/// Admin sets the customer's initial PIN directly (e.g. in person at a
/// branch); the customer can change it later via `/users/me/pin`.
#[derive(Debug, Deserialize)]
pub struct AdminCreateUserDTO {
    pub phone: String,
    /// Optional. When omitted the account gets a random PIN nobody sees, and
    /// the member sets their own through "Forgot PIN" (an invitation is sent).
    #[serde(default)]
    pub pin: Option<String>,
    pub first_name: String,
    #[serde(default)]
    pub last_name: Option<String>,
    #[serde(default)]
    pub email: Option<String>,
    /// Employee HR code. Optional here (plain customers have none); the
    /// add-employee form requires it. DB UNIQUE guards duplicates.
    #[serde(default)]
    pub hr_code: Option<String>,
    /// The referrer's `referral_code`, if this customer is being added as
    /// someone else's referral.
    #[serde(default)]
    pub referred_by_code: Option<String>,
    #[serde(default)]
    pub date_of_birth: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct ChangePinDTO {
    pub current_pin: String,
    pub new_pin: String,
}
