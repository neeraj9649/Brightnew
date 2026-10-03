use crate::api::dto::note::NoteDTO;
use crate::domain::models::note::BookingNote;

impl From<BookingNote> for NoteDTO {
    fn from(value: BookingNote) -> Self {
        Self {
            id: value.id,
            booking_id: value.booking_id,
            author_id: value.author_id,
            note: value.note,
            note_type: value.note_type,
            created_at: value.created_at,
        }
    }
}
