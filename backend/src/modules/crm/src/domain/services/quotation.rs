use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::errors::crm_errors::CrmError;
use crate::domain::models::quotation::Quotation;

#[async_trait]
pub trait QuotationService: 'static + Sync + Send {
    async fn add_quotation(
        &self,
        booking_id: Uuid,
        file_id: String,
        uploaded_by: Uuid,
    ) -> Result<Quotation, CrmError>;
    async fn list_for_booking(
        &self,
        booking_id: Uuid,
    ) -> Result<Vec<Quotation>, CrmError>;
}
