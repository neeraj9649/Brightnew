use async_trait::async_trait;
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

use crate::domain::errors::crm_errors::CrmError;
use crate::domain::models::quotation::{CreateQuotation, Quotation};
use crate::domain::repositories::quotation::QuotationRepository;
use crate::domain::services::quotation::QuotationService;
use crate::infrastructure::repositories::quotation::QuotationSqlxRepository;

#[derive(Clone)]
pub struct QuotationServiceImpl {
    pub repository: Arc<dyn QuotationRepository>,
}

impl QuotationServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { repository: Arc::new(QuotationSqlxRepository::new(pool)) }
    }
}

#[async_trait]
impl QuotationService for QuotationServiceImpl {
    async fn add_quotation(
        &self,
        booking_id: Uuid,
        file_id: String,
        uploaded_by: Uuid,
    ) -> Result<Quotation, CrmError> {
        self.repository
            .create(&CreateQuotation { booking_id, file_id, uploaded_by })
            .await
            .map_err(CrmError::InternalServerError)
    }

    async fn list_for_booking(
        &self,
        booking_id: Uuid,
    ) -> Result<Vec<Quotation>, CrmError> {
        self.repository
            .list_for_booking(booking_id)
            .await
            .map_err(CrmError::InternalServerError)
    }
}
