use actix_multipart::Multipart;
use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};
use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use base::error::{ApiError, ApiResponse};
use base::jwt_claims::JwtClaims;
use futures_util::TryStreamExt;
use serde::Serialize;

#[derive(Serialize)]
struct UploadedFileDTO {
    file_id: String,
    url: String,
}

async fn upload_to_namespace(
    mut payload: Multipart,
    claims: JwtClaims,
    namespace: &str,
) -> Result<ApiResponse<UploadedFileDTO>, ApiError> {
    let mut field = payload
        .try_next()
        .await
        .map_err(|err| ApiError::new(err.to_string(), 400))?
        .ok_or_else(|| ApiError::new("No file provided", 400))?;

    let filename =
        field.content_disposition().get_filename().unwrap_or("file.bin").to_string();
    let content_type = field.content_type().map(|m| m.to_string());

    let mut bytes = web::BytesMut::new();
    while let Some(chunk) = field
        .try_next()
        .await
        .map_err(|err| ApiError::new(err.to_string(), 400))?
    {
        bytes.extend_from_slice(&chunk);
    }

    let file_id = shared::cloud_storage::php_uploader::upload_file_bytes_to_php_uploader(
        bytes.freeze(),
        &filename,
        content_type.as_deref(),
        namespace,
        &claims.sub.to_string(),
    )
    .await
    .map_err(|err| ApiError::new(err, 502))?;

    let url = shared::cloud_storage::php_uploader::file_url(&file_id)
        .unwrap_or_else(|_| file_id.clone());

    Ok(ApiResponse(UploadedFileDTO { file_id, url }))
}

async fn upload_profile_image_handler(
    payload: Multipart,
    claims: JwtClaims,
) -> Result<ApiResponse<UploadedFileDTO>, ApiError> {
    upload_to_namespace(payload, claims, "profile-images").await
}

async fn upload_booking_document_handler(
    payload: Multipart,
    claims: JwtClaims,
) -> Result<ApiResponse<UploadedFileDTO>, ApiError> {
    upload_to_namespace(payload, claims, "booking-documents").await
}

async fn upload_visa_document_handler(
    payload: Multipart,
    claims: JwtClaims,
) -> Result<ApiResponse<UploadedFileDTO>, ApiError> {
    upload_to_namespace(payload, claims, "visa-documents").await
}

pub fn uploads_routes(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/uploads")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, &[]).await
            }))
            .route("/profile-image", web::post().to(upload_profile_image_handler))
            .route(
                "/booking-document",
                web::post().to(upload_booking_document_handler),
            )
            .route("/visa-document", web::post().to(upload_visa_document_handler)),
    );
}
