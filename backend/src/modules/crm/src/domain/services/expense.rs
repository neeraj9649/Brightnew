use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::errors::crm_errors::CrmError;
use crate::domain::models::expense::{BookingExpense, CreateBookingExpense};

#[async_trait]
pub trait BookingExpenseService: 'static + Sync + Send {
    async fn add(
        &self,
        new_expense: CreateBookingExpense,
    ) -> Result<BookingExpense, CrmError>;
    async fn list_for_booking(
        &self,
        booking_id: Uuid,
    ) -> Result<Vec<BookingExpense>, CrmError>;
    async fn delete(&self, id: Uuid) -> Result<(), CrmError>;
}
