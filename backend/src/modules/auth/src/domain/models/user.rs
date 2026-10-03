use bigdecimal::BigDecimal;
use chrono::{DateTime, NaiveDate, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: Option<String>,
    pub pin_hash: String,
    pub first_name: String,
    pub last_name: Option<String>,
    pub phone: String,
    pub role: String,
    pub is_active: bool,
    pub membership_tier: String,
    pub membership_code: String,
    pub referral_code: Option<String>,
    pub hr_code: Option<String>,
    pub tokens: i32,
    pub lifetime_points_earned: i64,
    pub total_bookings: i32,
    pub total_spent: BigDecimal,
    pub profile_image_file_id: Option<String>,
    pub date_of_birth: Option<NaiveDate>,
    pub notifications_seen_at: Option<DateTime<Utc>>,
    pub joined_at: DateTime<Utc>,
    pub last_active: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct CreateUser {
    pub email: Option<String>,
    pub pin_hash: String,
    pub first_name: String,
    pub last_name: Option<String>,
    pub phone: String,
    pub membership_tier: String,
    pub membership_code: String,
    pub referral_code: String,
    pub hr_code: Option<String>,
    pub date_of_birth: NaiveDate,
}

#[derive(Debug, Clone, Default)]
pub struct UpdateUser {
    pub id: Uuid,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub phone: Option<String>,
    pub role: Option<String>,
    pub is_active: Option<bool>,
    pub membership_tier: Option<String>,
    pub tokens: Option<i32>,
    pub total_bookings: Option<i32>,
    pub total_spent: Option<BigDecimal>,
    pub profile_image_file_id: Option<String>,
    pub pin_hash: Option<String>,
    pub last_active: Option<DateTime<Utc>>,
    pub notifications_seen_at: Option<DateTime<Utc>>,
}
