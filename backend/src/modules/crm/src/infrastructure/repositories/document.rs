use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::models::document::{BookingDocument, CreateBookingDocument};
use crate::domain::repositories::document::BookingDocumentRepository;
use base::result_paging::RepositoryResult;

pub struct BookingDocumentSqlxRepository {
    pub pool: PgPool,
}

impl BookingDocumentSqlxRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl BookingDocumentRepository for BookingDocumentSqlxRepository {
    async fn create(
        &self,
        d: &CreateBookingDocument,
    ) -> RepositoryResult<BookingDocument> {
        Ok(sqlx::query_as!(
            BookingDocument,
            r#"
            INSERT INTO booking_documents
                (id, booking_id, kind, file_id, label, uploaded_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, booking_id, kind, file_id, label, uploaded_by,
                created_at
            "#,
            Uuid::new_v4(),
            d.booking_id,
            d.kind,
            d.file_id,
            d.label,
            d.uploaded_by
        )
        .fetch_one(&self.pool)
        .await?)
    }

    async fn list_for_booking(
        &self,
        booking_id: Uuid,
    ) -> RepositoryResult<Vec<BookingDocument>> {
        Ok(sqlx::query_as!(
            BookingDocument,
            r#"
            SELECT id, booking_id, kind, file_id, label, uploaded_by, created_at
            FROM booking_documents
            WHERE booking_id = $1
            ORDER BY created_at DESC
            "#,
            booking_id
        )
        .fetch_all(&self.pool)
        .await?)
    }

    async fn list_customer_visible(
        &self,
        booking_id: Uuid,
        user_id: Uuid,
    ) -> RepositoryResult<Vec<BookingDocument>> {
        Ok(sqlx::query_as!(
            BookingDocument,
            r#"
            SELECT d.id, d.booking_id, d.kind, d.file_id, d.label,
                d.uploaded_by, d.created_at
            FROM booking_documents d
            JOIN bookings b ON b.id = d.booking_id
            WHERE d.booking_id = $1
                AND b.user_id = $2
                AND d.kind IN ('ticket', 'voucher', 'invoice')
            ORDER BY d.created_at DESC
            "#,
            booking_id,
            user_id
        )
        .fetch_all(&self.pool)
        .await?)
    }

    async fn delete(&self, id: Uuid) -> RepositoryResult<()> {
        sqlx::query!(r#"DELETE FROM booking_documents WHERE id = $1"#, id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}
