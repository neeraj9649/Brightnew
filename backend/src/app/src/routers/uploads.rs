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

const MAX_UPLOAD_BYTES: usize = 10 * 1024 * 1024;
const IMAGE_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "webp", "gif"];
const DOCUMENT_EXTENSIONS: &[&str] = &[
    "jpg", "jpeg", "png", "webp", "gif", "pdf", "doc", "docx", "xls", "xlsx", "csv", "txt",
];

/// Lower-cased extension of `filename` when it is on the allowed list.
fn allowed_extension(filename: &str, allowed: &[&str]) -> Option<String> {
    let (_, ext) = filename.rsplit_once('.')?;
    let ext = ext.trim().to_ascii_lowercase();
    allowed.contains(&ext.as_str()).then_some(ext)
}

/// The file's leading bytes must match what its extension claims, for the
/// formats we can recognise cheaply (the rest are accepted by extension alone).
fn content_matches(ext: &str, bytes: &[u8]) -> bool {
    match ext {
        "jpg" | "jpeg" => bytes.starts_with(&[0xFF, 0xD8, 0xFF]),
        "png" => bytes.starts_with(&[0x89, b'P', b'N', b'G']),
        "gif" => bytes.starts_with(b"GIF8"),
        "webp" => bytes.len() > 12 && &bytes[0..4] == b"RIFF" && &bytes[8..12] == b"WEBP",
        "pdf" => bytes.starts_with(b"%PDF"),
        _ => true,
    }
}

#[derive(Serialize)]
struct UploadedFileDTO {
    file_id: String,
    url: String,
}

async fn upload_to_namespace(
    mut payload: Multipart,
    claims: JwtClaims,
    namespace: &str,
    allowed_extensions: &[&str],
) -> Result<ApiResponse<UploadedFileDTO>, ApiError> {
    let mut field = payload
        .try_next()
        .await
        .map_err(|err| ApiError::new(err.to_string(), 400))?
        .ok_or_else(|| ApiError::new("No file provided", 400))?;

    let original = field.content_disposition().get_filename().unwrap_or("").to_string();
    let Some(ext) = allowed_extension(&original, allowed_extensions) else {
        return Err(ApiError::new(
            format!("This file type is not allowed. Allowed: {}", allowed_extensions.join(", ")),
            400,
        ));
    };
    // Only the vetted extension is forwarded; the client's own file name is not.
    let filename = format!("upload.{ext}");
    let content_type = field.content_type().map(|m| m.to_string());

    let mut bytes = web::BytesMut::new();
    while let Some(chunk) = field
        .try_next()
        .await
        .map_err(|err| ApiError::new(err.to_string(), 400))?
    {
        if bytes.len() + chunk.len() > MAX_UPLOAD_BYTES {
            return Err(ApiError::new("File is too large (10 MB maximum)", 413));
        }
        bytes.extend_from_slice(&chunk);
    }
    if bytes.is_empty() || !content_matches(&ext, &bytes) {
        return Err(ApiError::new("The file content does not match its type", 400));
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
    upload_to_namespace(payload, claims, "profile-images", IMAGE_EXTENSIONS).await
}

async fn upload_booking_document_handler(
    payload: Multipart,
    claims: JwtClaims,
) -> Result<ApiResponse<UploadedFileDTO>, ApiError> {
    upload_to_namespace(payload, claims, "booking-documents", DOCUMENT_EXTENSIONS).await
}

async fn upload_visa_document_handler(
    payload: Multipart,
    claims: JwtClaims,
) -> Result<ApiResponse<UploadedFileDTO>, ApiError> {
    upload_to_namespace(payload, claims, "visa-documents", DOCUMENT_EXTENSIONS).await
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
