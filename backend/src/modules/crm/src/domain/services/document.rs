use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::errors::crm_errors::CrmError;
use crate::domain::models::document::{BookingDocument, CreateBookingDocument};

#[async_trait]
pub trait BookingDocumentService: 'static + Sync + Send {
    async fn add(
        &self,
        new_document: CreateBookingDocument,
    ) -> Result<BookingDocument, CrmError>;
    async fn list_for_booking(
        &self,
        booking_id: Uuid,
    ) -> Result<Vec<BookingDocument>, CrmError>;
    async fn list_customer_visible(
        &self,
        booking_id: Uuid,
        user_id: Uuid,
    ) -> Result<Vec<BookingDocument>, CrmError>;
    async fn delete(&self, id: Uuid) -> Result<(), CrmError>;
}
