use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::models::quotation::{CreateQuotation, Quotation};
use base::result_paging::RepositoryResult;

#[async_trait]
pub trait QuotationRepository: Send + Sync {
    async fn create(
        &self,
        new_quotation: &CreateQuotation,
    ) -> RepositoryResult<Quotation>;
    async fn list_for_booking(
        &self,
        booking_id: Uuid,
    ) -> RepositoryResult<Vec<Quotation>>;
}
