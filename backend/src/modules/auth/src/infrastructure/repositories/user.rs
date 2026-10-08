use async_trait::async_trait;
use chrono::Utc;
use sqlx::{query_as, PgPool};
use uuid::Uuid;

use crate::domain::models::user::{CreateUser, UpdateUser, User};
use crate::domain::repositories::user::UserRepository;
use base::result_paging::{RepositoryResult, ResultPaging};

pub struct UserSqlxRepository {
    pub pool: PgPool,
}

impl UserSqlxRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

// Explicit projections keep SQLx decoding independent of the physical column
// order, which can differ on databases upgraded from older schema versions.
#[async_trait]
impl UserRepository for UserSqlxRepository {
    async fn create(&self, new_user: &CreateUser) -> RepositoryResult<User> {
        Ok(query_as!(
            User,
            r#"
            INSERT INTO users
                (id, email, pin_hash, first_name, last_name, phone,
                 membership_tier, membership_code, referral_code, hr_code,
                 date_of_birth, joined_at, last_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $12, $12, $12)
            RETURNING id, email, pin_hash, first_name, last_name, phone, role, is_active,
                membership_tier, membership_code, referral_code, hr_code, tokens,
                lifetime_points_earned, total_bookings, total_spent,
                profile_image_file_id, date_of_birth, notifications_seen_at,
                joined_at, last_active, created_at, updated_at
            "#,
            Uuid::new_v4(),
            new_user.email,
            new_user.pin_hash,
            new_user.first_name,
            new_user.last_name,
            new_user.phone,
            new_user.membership_tier,
            new_user.membership_code,
            new_user.referral_code,
            new_user.hr_code,
            new_user.date_of_birth,
            Utc::now()
        )
        .fetch_one(&self.pool)
        .await?)
    }

    async fn update(&self, update_user: &UpdateUser) -> RepositoryResult<User> {
        Ok(query_as!(
            User,
            r#"
            UPDATE users
            SET
                first_name = COALESCE($2, first_name),
                last_name = COALESCE($3, last_name),
                phone = COALESCE($4, phone),
                role = COALESCE($5, role),
                membership_tier = COALESCE($6, membership_tier),
                tokens = COALESCE($7, tokens),
                total_bookings = COALESCE($8, total_bookings),
                total_spent = COALESCE($9, total_spent),
                profile_image_file_id = COALESCE($10, profile_image_file_id),
                pin_hash = COALESCE($11, pin_hash),
                last_active = COALESCE($12, last_active),
                is_active = COALESCE($13, is_active),
                notifications_seen_at = COALESCE($14, notifications_seen_at)
            WHERE id = $1
            RETURNING id, email, pin_hash, first_name, last_name, phone, role, is_active,
                membership_tier, membership_code, referral_code, hr_code, tokens,
                lifetime_points_earned, total_bookings, total_spent,
                profile_image_file_id, date_of_birth, notifications_seen_at,
                joined_at, last_active, created_at, updated_at
            "#,
            update_user.id,
            update_user.first_name,
            update_user.last_name,
            update_user.phone,
            update_user.role,
            update_user.membership_tier,
            update_user.tokens,
            update_user.total_bookings,
            update_user.total_spent,
            update_user.profile_image_file_id,
            update_user.pin_hash,
            update_user.last_active,
            update_user.is_active,
            update_user.notifications_seen_at
        )
        .fetch_one(&self.pool)
        .await?)
    }

    async fn list(&self) -> RepositoryResult<ResultPaging<User>> {
        let items = query_as!(
            User,
            r#"SELECT id, email, pin_hash, first_name, last_name, phone, role, is_active,
                membership_tier, membership_code, referral_code, hr_code, tokens,
                lifetime_points_earned, total_bookings, total_spent,
                profile_image_file_id, date_of_birth, notifications_seen_at,
                joined_at, last_active, created_at, updated_at
            FROM users ORDER BY created_at DESC"#
        )
        .fetch_all(&self.pool)
        .await?;
        let total = items.len() as i64;
        Ok(ResultPaging { total, items })
    }

    async fn get(&self, user_id: Uuid) -> RepositoryResult<Option<User>> {
        Ok(query_as!(
            User,
            r#"SELECT id, email, pin_hash, first_name, last_name, phone, role, is_active,
                membership_tier, membership_code, referral_code, hr_code, tokens,
                lifetime_points_earned, total_bookings, total_spent,
                profile_image_file_id, date_of_birth, notifications_seen_at,
                joined_at, last_active, created_at, updated_at
            FROM users WHERE id = $1"#,
            user_id
        )
        .fetch_optional(&self.pool)
        .await?)
    }

    async fn get_by_phone(&self, phone: &str) -> RepositoryResult<Option<User>> {
        Ok(query_as!(
            User,
            r#"SELECT id, email, pin_hash, first_name, last_name, phone, role, is_active,
                membership_tier, membership_code, referral_code, hr_code, tokens,
                lifetime_points_earned, total_bookings, total_spent,
                profile_image_file_id, date_of_birth, notifications_seen_at,
                joined_at, last_active, created_at, updated_at
            FROM users WHERE phone = $1"#,
            phone
        )
        .fetch_optional(&self.pool)
        .await?)
    }

    async fn get_by_referral_code(&self, referral_code: &str) -> RepositoryResult<Option<User>> {
        Ok(query_as!(
            User,
            r#"SELECT id, email, pin_hash, first_name, last_name, phone, role, is_active,
                membership_tier, membership_code, referral_code, hr_code, tokens,
                lifetime_points_earned, total_bookings, total_spent,
                profile_image_file_id, date_of_birth, notifications_seen_at,
                joined_at, last_active, created_at, updated_at
            FROM users WHERE referral_code = $1"#,
            referral_code
        )
        .fetch_optional(&self.pool)
        .await?)
    }
}
