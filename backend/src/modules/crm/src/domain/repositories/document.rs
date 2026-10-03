use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::models::document::{BookingDocument, CreateBookingDocument};
use base::result_paging::RepositoryResult;

#[async_trait]
pub trait BookingDocumentRepository: Send + Sync {
    async fn create(
        &self,
        new_document: &CreateBookingDocument,
    ) -> RepositoryResult<BookingDocument>;
    async fn list_for_booking(
        &self,
        booking_id: Uuid,
    ) -> RepositoryResult<Vec<BookingDocument>>;
    /// Customer-facing: only documents on a booking the user owns, and only
    /// the kinds a customer should see (ticket/voucher/invoice).
    async fn list_customer_visible(
        &self,
        booking_id: Uuid,
        user_id: Uuid,
    ) -> RepositoryResult<Vec<BookingDocument>>;
    async fn delete(&self, id: Uuid) -> RepositoryResult<()>;
}
