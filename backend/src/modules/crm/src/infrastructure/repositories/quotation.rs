use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::models::quotation::{CreateQuotation, Quotation};
use crate::domain::repositories::quotation::QuotationRepository;
use base::result_paging::RepositoryResult;

pub struct QuotationSqlxRepository {
    pub pool: PgPool,
}

impl QuotationSqlxRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl QuotationRepository for QuotationSqlxRepository {
    async fn create(
        &self,
        new_quotation: &CreateQuotation,
    ) -> RepositoryResult<Quotation> {
        Ok(sqlx::query_as!(
            Quotation,
            r#"
            INSERT INTO quotations (id, booking_id, file_id, uploaded_by)
            VALUES ($1, $2, $3, $4)
            RETURNING id, booking_id, file_id, uploaded_by, created_at
            "#,
            Uuid::new_v4(),
            new_quotation.booking_id,
            new_quotation.file_id,
            new_quotation.uploaded_by
        )
        .fetch_one(&self.pool)
        .await?)
    }

    async fn list_for_booking(
        &self,
        booking_id: Uuid,
    ) -> RepositoryResult<Vec<Quotation>> {
        Ok(sqlx::query_as!(
            Quotation,
            r#"
            SELECT id, booking_id, file_id, uploaded_by, created_at
            FROM quotations WHERE booking_id = $1 ORDER BY created_at DESC
            "#,
            booking_id
        )
        .fetch_all(&self.pool)
        .await?)
    }
}
