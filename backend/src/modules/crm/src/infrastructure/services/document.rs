use async_trait::async_trait;
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

use crate::domain::errors::crm_errors::CrmError;
use crate::domain::models::document::{BookingDocument, CreateBookingDocument};
use crate::domain::repositories::document::BookingDocumentRepository;
use crate::domain::services::document::BookingDocumentService;
use crate::infrastructure::repositories::document::BookingDocumentSqlxRepository;

#[derive(Clone)]
pub struct BookingDocumentServiceImpl {
    pub repository: Arc<dyn BookingDocumentRepository>,
}

impl BookingDocumentServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { repository: Arc::new(BookingDocumentSqlxRepository::new(pool)) }
    }
}

#[async_trait]
impl BookingDocumentService for BookingDocumentServiceImpl {
    async fn add(
        &self,
        new_document: CreateBookingDocument,
    ) -> Result<BookingDocument, CrmError> {
        self.repository
            .create(&new_document)
            .await
            .map_err(CrmError::InternalServerError)
    }

    async fn list_for_booking(
        &self,
        booking_id: Uuid,
    ) -> Result<Vec<BookingDocument>, CrmError> {
        self.repository
            .list_for_booking(booking_id)
            .await
            .map_err(CrmError::InternalServerError)
    }

    async fn list_customer_visible(
        &self,
        booking_id: Uuid,
        user_id: Uuid,
    ) -> Result<Vec<BookingDocument>, CrmError> {
        self.repository
            .list_customer_visible(booking_id, user_id)
            .await
            .map_err(CrmError::InternalServerError)
    }

    async fn delete(&self, id: Uuid) -> Result<(), CrmError> {
        self.repository.delete(id).await.map_err(CrmError::InternalServerError)
    }
}
