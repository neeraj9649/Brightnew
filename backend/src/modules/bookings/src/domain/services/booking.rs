use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::errors::booking_errors::BookingError;
use crate::domain::models::booking::{Booking, CreateBooking, UpdateBooking};

#[async_trait]
pub trait BookingService: 'static + Sync + Send {
    async fn create(
        &self,
        new_booking: CreateBooking,
    ) -> Result<Booking, BookingError>;
    async fn get_owned(
        &self,
        booking_id: Uuid,
        user_id: Uuid,
    ) -> Result<Booking, BookingError>;
    async fn list_for_user(
        &self,
        user_id: Uuid,
    ) -> Result<Vec<Booking>, BookingError>;
    async fn list_all(
        &self,
        status: Option<String>,
        assigned_employee_id: Option<Uuid>,
    ) -> Result<Vec<Booking>, BookingError>;
    async fn cancel(
        &self,
        booking_id: Uuid,
        user_id: Uuid,
    ) -> Result<Booking, BookingError>;
    /// `acting_employee_id`: `Some(id)` when the caller is an employee (must
    /// be the booking's assigned employee), `None` for admins/managers (no
    /// ownership restriction).
    async fn admin_update(
        &self,
        update_booking: UpdateBooking,
        acting_employee_id: Option<Uuid>,
    ) -> Result<Booking, BookingError>;
}
