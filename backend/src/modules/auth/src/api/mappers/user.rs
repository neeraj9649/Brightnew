use crate::api::dto::user::UserDTO;
use crate::domain::models::user::User;

impl From<User> for UserDTO {
    fn from(value: User) -> Self {
        let profile_image_url = value
            .profile_image_file_id
            .as_deref()
            .and_then(|id| shared::cloud_storage::php_uploader::file_url(id).ok());

        Self {
            id: value.id,
            phone: value.phone,
            email: value.email,
            first_name: value.first_name,
            last_name: value.last_name,
            role: value.role,
            is_active: value.is_active,
            membership_tier: value.membership_tier,
            membership_code: value.membership_code,
            referral_code: value.referral_code,
            hr_code: value.hr_code,
            tokens: value.tokens,
            lifetime_points_earned: value.lifetime_points_earned,
            total_bookings: value.total_bookings,
            total_spent: value.total_spent.to_string().parse().unwrap_or(0.0),
            profile_image_url,
            date_of_birth: value.date_of_birth,
            joined_at: value.joined_at,
            last_active: value.last_active,
        }
    }
}
