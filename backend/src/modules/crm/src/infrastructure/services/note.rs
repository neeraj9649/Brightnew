use async_trait::async_trait;
use sqlx::PgPool;
use std::sync::Arc;
use uuid::Uuid;

use crate::domain::errors::crm_errors::CrmError;
use crate::domain::models::note::{BookingNote, CreateBookingNote};
use crate::domain::repositories::note::BookingNoteRepository;
use crate::domain::services::note::BookingNoteService;
use crate::infrastructure::repositories::note::BookingNoteSqlxRepository;

#[derive(Clone)]
pub struct BookingNoteServiceImpl {
    pub repository: Arc<dyn BookingNoteRepository>,
}

impl BookingNoteServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { repository: Arc::new(BookingNoteSqlxRepository::new(pool)) }
    }
}

#[async_trait]
impl BookingNoteService for BookingNoteServiceImpl {
    async fn add_note(
        &self,
        booking_id: Uuid,
        author_id: Uuid,
        note: String,
        note_type: String,
    ) -> Result<BookingNote, CrmError> {
        if note.trim().is_empty() {
            return Err(CrmError::InvalidInput("Note cannot be empty".to_string()));
        }
        if note_type != "communication" && note_type != "support" {
            return Err(CrmError::InvalidInput("Invalid note type".to_string()));
        }
        self.repository
            .create(&CreateBookingNote { booking_id, author_id, note, note_type })
            .await
            .map_err(CrmError::InternalServerError)
    }

    async fn list_for_booking(
        &self,
        booking_id: Uuid,
    ) -> Result<Vec<BookingNote>, CrmError> {
        self.repository
            .list_for_booking(booking_id)
            .await
            .map_err(CrmError::InternalServerError)
    }
}
