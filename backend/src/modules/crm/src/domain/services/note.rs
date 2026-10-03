use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::errors::crm_errors::CrmError;
use crate::domain::models::note::BookingNote;

#[async_trait]
pub trait BookingNoteService: 'static + Sync + Send {
    async fn add_note(
        &self,
        booking_id: Uuid,
        author_id: Uuid,
        note: String,
        note_type: String,
    ) -> Result<BookingNote, CrmError>;
    async fn list_for_booking(
        &self,
        booking_id: Uuid,
    ) -> Result<Vec<BookingNote>, CrmError>;
}
