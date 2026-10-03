use crate::api::dto::quotation::QuotationDTO;
use crate::domain::models::quotation::Quotation;

impl From<Quotation> for QuotationDTO {
    fn from(value: Quotation) -> Self {
        Self {
            id: value.id,
            booking_id: value.booking_id,
            file_id: value.file_id,
            uploaded_by: value.uploaded_by,
            created_at: value.created_at,
        }
    }
}
