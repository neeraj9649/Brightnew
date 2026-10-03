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
}

#[async_trait]
impl BookingService for BookingServiceImpl {
    async fn create(
        &self,
        mut new_booking: CreateBooking,
    ) -> Result<Booking, BookingError> {
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
        self.get_owned(booking_id, user_id).await?;

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
        }

        let updated = self
            .repository
            .update(&update_booking)
            .await
            .map_err(BookingError::InternalServerError)?;

        let just_completed = update_booking.status.as_deref()
            == Some("completed")
            && previous.status != "completed";
        if just_completed {
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
