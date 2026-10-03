use actix_web::web;
use base::error::{ApiError, ApiResponse};
use base::jwt_claims::JwtClaims;
use uuid::Uuid;

use crate::api::dto::note::{CreateNoteDTO, NoteDTO};
use crate::domain::services::note::BookingNoteService;

pub async fn create_note_handler(
    note_service: web::Data<dyn BookingNoteService>,
    claims: JwtClaims,
    body: web::Json<CreateNoteDTO>,
) -> Result<ApiResponse<NoteDTO>, ApiError> {
    let body = body.into_inner();
    let note = note_service
        .add_note(body.booking_id, claims.sub, body.note, body.note_type)
        .await?;
    Ok(ApiResponse(note.into()))
}

pub async fn list_notes_handler(
    note_service: web::Data<dyn BookingNoteService>,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<Vec<NoteDTO>>, ApiError> {
    let notes = note_service.list_for_booking(path.into_inner()).await?;
    Ok(ApiResponse(notes.into_iter().map(Into::into).collect()))
}
