use crate::domain::models::booking::{Booking, CreateBooking, UpdateBooking};
use async_trait::async_trait;
use base::result_paging::RepositoryResult;
use uuid::Uuid;

#[async_trait]
pub trait BookingRepository: Send + Sync {
    async fn create(
        &self,
        new_booking: &CreateBooking,
    ) -> RepositoryResult<Booking>;
    async fn update(
        &self,
        update_booking: &UpdateBooking,
    ) -> RepositoryResult<Booking>;
    async fn get(&self, booking_id: Uuid) -> RepositoryResult<Option<Booking>>;
    async fn list_for_user(
        &self,
        user_id: Uuid,
    ) -> RepositoryResult<Vec<Booking>>;
    /// `status`/`assigned_employee_id` each filter when present (None =
    /// no restriction on that field).
    async fn list_all(
        &self,
        status: Option<String>,
        assigned_employee_id: Option<Uuid>,
    ) -> RepositoryResult<Vec<Booking>>;
}
