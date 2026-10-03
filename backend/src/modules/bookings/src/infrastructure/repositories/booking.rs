use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::models::booking::{Booking, CreateBooking, UpdateBooking};
use crate::domain::repositories::booking::BookingRepository;
use base::result_paging::RepositoryResult;

pub struct BookingSqlxRepository {
    pub pool: PgPool,
}

impl BookingSqlxRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl BookingRepository for BookingSqlxRepository {
    async fn create(
        &self,
        new_booking: &CreateBooking,
    ) -> RepositoryResult<Booking> {
        Ok(sqlx::query_as!(
            Booking,
            r#"
            INSERT INTO bookings
                (id, display_code, user_id, type, membership_tier_snapshot,
                 estimated_cost, special_requests, details)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING id, display_code, user_id, type AS "booking_type",
                status, membership_tier_snapshot, estimated_cost, final_cost,
                payment_status, special_requests, admin_notes,
                assigned_employee_id, details, created_at, updated_at
            "#,
            Uuid::new_v4(),
            new_booking.display_code,
            new_booking.user_id,
            new_booking.booking_type,
            new_booking.membership_tier_snapshot,
            new_booking.estimated_cost,
            new_booking.special_requests,
            new_booking.details
        )
        .fetch_one(&self.pool)
        .await?)
    }

    async fn update(
        &self,
        update_booking: &UpdateBooking,
    ) -> RepositoryResult<Booking> {
        Ok(sqlx::query_as!(
            Booking,
            r#"
            UPDATE bookings
            SET
                status = COALESCE($2, status),
                final_cost = COALESCE($3, final_cost),
                payment_status = COALESCE($4, payment_status),
                admin_notes = COALESCE($5, admin_notes),
                assigned_employee_id = COALESCE($6, assigned_employee_id)
            WHERE id = $1
            RETURNING id, display_code, user_id, type AS "booking_type",
                status, membership_tier_snapshot, estimated_cost, final_cost,
                payment_status, special_requests, admin_notes,
                assigned_employee_id, details, created_at, updated_at
            "#,
            update_booking.id,
            update_booking.status,
            update_booking.final_cost,
            update_booking.payment_status,
            update_booking.admin_notes,
            update_booking.assigned_employee_id
        )
        .fetch_one(&self.pool)
        .await?)
    }

    async fn get(&self, booking_id: Uuid) -> RepositoryResult<Option<Booking>> {
        Ok(sqlx::query_as!(
            Booking,
            r#"
            SELECT id, display_code, user_id, type AS "booking_type",
                status, membership_tier_snapshot, estimated_cost, final_cost,
                payment_status, special_requests, admin_notes,
                assigned_employee_id, details, created_at, updated_at
            FROM bookings WHERE id = $1
            "#,
            booking_id
        )
        .fetch_optional(&self.pool)
        .await?)
    }

    async fn list_for_user(
        &self,
        user_id: Uuid,
    ) -> RepositoryResult<Vec<Booking>> {
        Ok(sqlx::query_as!(
            Booking,
            r#"
            SELECT id, display_code, user_id, type AS "booking_type",
                status, membership_tier_snapshot, estimated_cost, final_cost,
                payment_status, special_requests, admin_notes,
                assigned_employee_id, details, created_at, updated_at
            FROM bookings WHERE user_id = $1 ORDER BY created_at DESC
            "#,
            user_id
        )
        .fetch_all(&self.pool)
        .await?)
    }

    async fn list_all(
        &self,
        status: Option<String>,
        assigned_employee_id: Option<Uuid>,
    ) -> RepositoryResult<Vec<Booking>> {
        Ok(sqlx::query_as!(
            Booking,
            r#"
            SELECT id, display_code, user_id, type AS "booking_type",
                status, membership_tier_snapshot, estimated_cost, final_cost,
                payment_status, special_requests, admin_notes,
                assigned_employee_id, details, created_at, updated_at
            FROM bookings
            WHERE ($1::text IS NULL OR status = $1)
                AND ($2::uuid IS NULL OR assigned_employee_id = $2)
            ORDER BY created_at DESC
            "#,
            status,
            assigned_employee_id
        )
        .fetch_all(&self.pool)
        .await?)
    }
}
