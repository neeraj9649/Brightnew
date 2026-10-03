use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::models::expense::{BookingExpense, CreateBookingExpense};
use base::result_paging::RepositoryResult;

#[async_trait]
pub trait BookingExpenseRepository: Send + Sync {
    async fn create(
        &self,
        new_expense: &CreateBookingExpense,
    ) -> RepositoryResult<BookingExpense>;
    async fn list_for_booking(
        &self,
        booking_id: Uuid,
    ) -> RepositoryResult<Vec<BookingExpense>>;
    async fn delete(&self, id: Uuid) -> RepositoryResult<()>;
}
