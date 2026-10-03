use async_trait::async_trait;
use uuid::Uuid;

use crate::domain::models::note::{BookingNote, CreateBookingNote};
use base::result_paging::RepositoryResult;

#[async_trait]
pub trait BookingNoteRepository: Send + Sync {
    async fn create(
        &self,
        new_note: &CreateBookingNote,
    ) -> RepositoryResult<BookingNote>;
    async fn list_for_booking(
        &self,
        booking_id: Uuid,
    ) -> RepositoryResult<Vec<BookingNote>>;
}
