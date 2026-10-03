use async_trait::async_trait;
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

use crate::domain::errors::crm_errors::CrmError;
use crate::domain::models::expense::{BookingExpense, CreateBookingExpense};
use crate::domain::repositories::expense::BookingExpenseRepository;
use crate::domain::services::expense::BookingExpenseService;
use crate::infrastructure::repositories::expense::BookingExpenseSqlxRepository;

#[derive(Clone)]
pub struct BookingExpenseServiceImpl {
    pub repository: Arc<dyn BookingExpenseRepository>,
}

impl BookingExpenseServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { repository: Arc::new(BookingExpenseSqlxRepository::new(pool)) }
    }
}

#[async_trait]
impl BookingExpenseService for BookingExpenseServiceImpl {
    async fn add(
        &self,
        new_expense: CreateBookingExpense,
    ) -> Result<BookingExpense, CrmError> {
        self.repository
            .create(&new_expense)
            .await
            .map_err(CrmError::InternalServerError)
    }

    async fn list_for_booking(
        &self,
        booking_id: Uuid,
    ) -> Result<Vec<BookingExpense>, CrmError> {
        self.repository
            .list_for_booking(booking_id)
            .await
            .map_err(CrmError::InternalServerError)
    }

    async fn delete(&self, id: Uuid) -> Result<(), CrmError> {
        self.repository.delete(id).await.map_err(CrmError::InternalServerError)
    }
}
