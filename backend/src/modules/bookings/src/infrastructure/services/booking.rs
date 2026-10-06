use async_trait::async_trait;
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

use crate::domain::errors::booking_errors::BookingError;
use crate::domain::models::booking::{Booking, CreateBooking, UpdateBooking};
use crate::domain::repositories::booking::BookingRepository;
use crate::domain::services::booking::BookingService;
use crate::infrastructure::repositories::booking::BookingSqlxRepository;
use base::error::RepositoryError;
use rewards::domain::services::rewards::RewardsService;

#[derive(Clone)]
pub struct BookingServiceImpl {
    pub repository: Arc<dyn BookingRepository>,
    pub rewards_service: Arc<dyn RewardsService>,
}

impl BookingServiceImpl {
    pub fn new(pool: PgPool, rewards_service: Arc<dyn RewardsService>) -> Self {
        Self {
            repository: Arc::new(BookingSqlxRepository::new(pool)),
            rewards_service,
        }
    }

    fn validate_booking_type(booking_type: &str) -> bool {
        matches!(
            booking_type,
            "flight"
                | "visa"
                | "tour"
                | "hotel"
                | "airport_transfer"
                | "cruise"
                | "insurance"
                | "activity"
                | "car_rental"
                | "custom"
        )
    }

    fn validate_status(status: &str) -> bool {
        matches!(
            status,
            "new"
                | "assigned"
                | "contacted"
                | "awaiting_approval"
                | "awaiting_payment"
                | "payment_received"
                | "booking_confirmed"
                | "completed"
                | "cancelled"
        )
    }
}

#[async_trait]
impl BookingService for BookingServiceImpl {
    async fn create(
        &self,
        mut new_booking: CreateBooking,
    ) -> Result<Booking, BookingError> {
        if !Self::validate_booking_type(&new_booking.booking_type) {
            return Err(BookingError::InvalidBookingType);
        }
        if new_booking.estimated_cost < bigdecimal::BigDecimal::from(0) {
            return Err(BookingError::InternalServerError(RepositoryError::new(
                "Estimated cost cannot be negative".to_string(),
            )));
        }
        new_booking.display_code =
            CreateBooking::generate_display_code(&new_booking.booking_type);

        self.repository
            .create(&new_booking)
            .await
            .map_err(BookingError::InternalServerError)
    }

    async fn get_owned(
        &self,
        booking_id: Uuid,
        user_id: Uuid,
    ) -> Result<Booking, BookingError> {
        let booking = self
            .repository
            .get(booking_id)
            .await
            .map_err(BookingError::InternalServerError)?
            .ok_or(BookingError::BookingDoesNotExist)?;

        if booking.user_id != user_id {
            return Err(BookingError::BookingNotOwnedByUser);
        }

        Ok(booking)
    }

    async fn list_for_user(
        &self,
        user_id: Uuid,
    ) -> Result<Vec<Booking>, BookingError> {
        self.repository
            .list_for_user(user_id)
            .await
            .map_err(BookingError::InternalServerError)
    }

    async fn list_all(
        &self,
        status: Option<String>,
        assigned_employee_id: Option<Uuid>,
    ) -> Result<Vec<Booking>, BookingError> {
        self.repository
            .list_all(status, assigned_employee_id)
            .await
            .map_err(BookingError::InternalServerError)
    }

    async fn cancel(
        &self,
        booking_id: Uuid,
        user_id: Uuid,
    ) -> Result<Booking, BookingError> {
        let current = self.get_owned(booking_id, user_id).await?;
        if matches!(current.status.as_str(), "completed" | "cancelled") {
            return Err(BookingError::BookingCannotBeCancelled);
        }

        self.repository
            .update(&UpdateBooking {
                id: booking_id,
                status: Some("cancelled".to_string()),
                ..Default::default()
            })
            .await
            .map_err(BookingError::InternalServerError)
    }

    async fn admin_update(
        &self,
        update_booking: UpdateBooking,
        acting_employee_id: Option<Uuid>,
    ) -> Result<Booking, BookingError> {
        let previous = self
            .repository
            .get(update_booking.id)
            .await
            .map_err(BookingError::InternalServerError)?
            .ok_or(BookingError::BookingDoesNotExist)?;

        if let Some(employee_id) = acting_employee_id {
            if previous.assigned_employee_id != Some(employee_id) {
                return Err(BookingError::BookingNotAssignedToEmployee);
            }
            if update_booking.assigned_employee_id.is_some()
                && update_booking.assigned_employee_id != Some(employee_id)
            {
                return Err(BookingError::BookingNotAssignedToEmployee);
            }
        }

        if let Some(status) = update_booking.status.as_deref() {
            if !Self::validate_status(status) {
                return Err(BookingError::InvalidBookingStatus);
            }
        }

        let updated = self
            .repository
            .update(&update_booking)
            .await
            .map_err(BookingError::InternalServerError)?;

        // Re-run the idempotent reward operation for an already-completed
        // booking too. If a transient reward/database error happened after
        // the status update, the next admin retry can repair the missing
        // ledger rows instead of permanently losing the reward.
        if updated.status == "completed" {
            self.rewards_service
                .award_for_completed_booking(
                    updated.user_id,
                    updated.id,
                    &updated.booking_type,
                )
                .await
                .map_err(|err| {
                    BookingError::InternalServerError(RepositoryError::new(
                        err.to_string(),
                    ))
                })?;
        }

        Ok(updated)
    }
}
