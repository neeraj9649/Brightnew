use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::models::expense::{BookingExpense, CreateBookingExpense};
use crate::domain::repositories::expense::BookingExpenseRepository;
use base::result_paging::RepositoryResult;

pub struct BookingExpenseSqlxRepository {
    pub pool: PgPool,
}

impl BookingExpenseSqlxRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl BookingExpenseRepository for BookingExpenseSqlxRepository {
    async fn create(
        &self,
        e: &CreateBookingExpense,
    ) -> RepositoryResult<BookingExpense> {
        Ok(sqlx::query_as!(
            BookingExpense,
            r#"
            INSERT INTO booking_expenses
                (id, booking_id, category, amount, vendor, description,
                 start_date, end_date, file_id, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id, booking_id, category, amount, vendor, description,
                start_date, end_date, file_id, created_by, created_at
            "#,
            Uuid::new_v4(),
            e.booking_id,
            e.category,
            e.amount,
            e.vendor,
            e.description,
            e.start_date,
            e.end_date,
            e.file_id,
            e.created_by
        )
        .fetch_one(&self.pool)
        .await?)
    }

    async fn list_for_booking(
        &self,
        booking_id: Uuid,
    ) -> RepositoryResult<Vec<BookingExpense>> {
        Ok(sqlx::query_as!(
            BookingExpense,
            r#"
            SELECT id, booking_id, category, amount, vendor, description,
                start_date, end_date, file_id, created_by, created_at
            FROM booking_expenses
            WHERE booking_id = $1
            ORDER BY start_date NULLS LAST, created_at
            "#,
            booking_id
        )
        .fetch_all(&self.pool)
        .await?)
    }

    async fn delete(&self, id: Uuid) -> RepositoryResult<()> {
        sqlx::query!(r#"DELETE FROM booking_expenses WHERE id = $1"#, id)
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}
