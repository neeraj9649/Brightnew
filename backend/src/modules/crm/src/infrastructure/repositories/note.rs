use async_trait::async_trait;
use sqlx::PgPool;
use uuid::Uuid;

use crate::domain::models::note::{BookingNote, CreateBookingNote};
use crate::domain::repositories::note::BookingNoteRepository;
use base::result_paging::RepositoryResult;

pub struct BookingNoteSqlxRepository {
    pub pool: PgPool,
}

impl BookingNoteSqlxRepository {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl BookingNoteRepository for BookingNoteSqlxRepository {
    async fn create(
        &self,
        new_note: &CreateBookingNote,
    ) -> RepositoryResult<BookingNote> {
        Ok(sqlx::query_as!(
            BookingNote,
            r#"
            INSERT INTO booking_notes (id, booking_id, author_id, note, note_type)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, booking_id, author_id, note, note_type, created_at
            "#,
            Uuid::new_v4(),
            new_note.booking_id,
            new_note.author_id,
            new_note.note,
            new_note.note_type
        )
        .fetch_one(&self.pool)
        .await?)
    }

    async fn list_for_booking(
        &self,
        booking_id: Uuid,
    ) -> RepositoryResult<Vec<BookingNote>> {
        Ok(sqlx::query_as!(
            BookingNote,
            r#"
            SELECT id, booking_id, author_id, note, note_type, created_at
            FROM booking_notes WHERE booking_id = $1 ORDER BY created_at DESC
            "#,
            booking_id
        )
        .fetch_all(&self.pool)
        .await?)
    }
}
