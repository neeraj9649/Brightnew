use actix_web::web;
use base::error::{ApiError, ApiResponse};
use base::jwt_claims::JwtClaims;
use uuid::Uuid;

use crate::api::dto::document::{BookingDocumentDTO, CreateBookingDocumentDTO};
use crate::domain::models::document::CreateBookingDocument;
use crate::domain::services::document::BookingDocumentService;

pub async fn create_document_handler(
    document_service: web::Data<dyn BookingDocumentService>,
    claims: JwtClaims,
    body: web::Json<CreateBookingDocumentDTO>,
) -> Result<ApiResponse<BookingDocumentDTO>, ApiError> {
    let b = body.into_inner();
    let document = document_service
        .add(CreateBookingDocument {
            booking_id: b.booking_id,
            kind: b.kind,
            file_id: b.file_id,
            label: b.label,
            uploaded_by: claims.sub,
        })
        .await?;
    Ok(ApiResponse(document.into()))
}

pub async fn list_documents_handler(
    document_service: web::Data<dyn BookingDocumentService>,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<Vec<BookingDocumentDTO>>, ApiError> {
    let documents =
        document_service.list_for_booking(path.into_inner()).await?;
    Ok(ApiResponse(documents.into_iter().map(Into::into).collect()))
}

pub async fn delete_document_handler(
    document_service: web::Data<dyn BookingDocumentService>,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<Uuid>, ApiError> {
    let id = path.into_inner();
    document_service.delete(id).await?;
    Ok(ApiResponse(id))
}
