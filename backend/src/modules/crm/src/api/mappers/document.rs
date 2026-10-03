use crate::api::dto::document::BookingDocumentDTO;
use crate::domain::models::document::BookingDocument;

impl From<BookingDocument> for BookingDocumentDTO {
    fn from(value: BookingDocument) -> Self {
        Self {
            id: value.id,
            booking_id: value.booking_id,
            kind: value.kind,
            file_id: value.file_id,
            label: value.label,
            uploaded_by: value.uploaded_by,
            created_at: value.created_at,
        }
    }
}
