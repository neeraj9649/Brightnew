use actix_web::web;
use base::error::{ApiError, ApiResponse};
use base::jwt_claims::JwtClaims;
use uuid::Uuid;

use crate::api::dto::quotation::{CreateQuotationDTO, QuotationDTO};
use crate::domain::services::quotation::QuotationService;

pub async fn create_quotation_handler(
    quotation_service: web::Data<dyn QuotationService>,
    claims: JwtClaims,
    body: web::Json<CreateQuotationDTO>,
) -> Result<ApiResponse<QuotationDTO>, ApiError> {
    let body = body.into_inner();
    let quotation = quotation_service
        .add_quotation(body.booking_id, body.file_id, claims.sub)
        .await?;
    Ok(ApiResponse(quotation.into()))
}

pub async fn list_quotations_handler(
    quotation_service: web::Data<dyn QuotationService>,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<Vec<QuotationDTO>>, ApiError> {
    let quotations = quotation_service.list_for_booking(path.into_inner()).await?;
    Ok(ApiResponse(quotations.into_iter().map(Into::into).collect()))
}
