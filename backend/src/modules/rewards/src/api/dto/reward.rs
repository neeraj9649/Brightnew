use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct RewardTransactionDTO {
    pub id: Uuid,
    pub points: i32,
    pub reason: String,
    pub source_type: Option<String>,
    pub source_id: Option<Uuid>,
    pub description: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct AdminAwardPointsDTO {
    pub user_id: Uuid,
    pub points: i32,
    #[serde(default)]
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ServicePointsDTO {
    pub booking_type: String,
    pub points: i32,
}

/// The configured reward amounts. Serialized for the customer/admin read view
/// ("how many Wings you earn per service"); deserialized as the admin update
/// body for `PUT /admin/points-config`.
#[derive(Debug, Serialize, Deserialize)]
pub struct PointsConfigDTO {
    pub welcome_bonus: i32,
    pub first_booking: i32,
    #[serde(default = "default_referral_points")]
    pub referral_booking: i32,
    pub services: Vec<ServicePointsDTO>,
}

fn default_referral_points() -> i32 {
    50
}
