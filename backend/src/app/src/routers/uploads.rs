use actix_multipart::Multipart;
use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};
use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use base::error::{ApiError, ApiResponse};
use base::jwt_claims::JwtClaims;
use base::role::{ADMIN_ONLY, STAFF};

const MAX_FILE_SIZE: usize = 10 * 1024 * 1024;
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

    if field.content_disposition().get_name() != Some("file")
        || field.content_disposition().get_filename().is_none()
    {
        return Err(ApiError::new(
            "Expected a multipart file field named 'file'",
            400,
        ));
    }

    let filename = field
        .content_disposition()
        .get_filename()
        .unwrap_or("file.bin")
        .to_string();
    let content_type = field.content_type().map(|m| m.to_string());

    let mut bytes = web::BytesMut::new();
    while let Some(chunk) = field
        .try_next()
        .await
        .map_err(|err| ApiError::new(err.to_string(), 400))?
    {
        if bytes.len().saturating_add(chunk.len()) > MAX_FILE_SIZE {
            return Err(ApiError::new("File exceeds the 10 MiB upload limit", 413));
        }
        bytes.extend_from_slice(&chunk);
    }

    if bytes.is_empty() {
        return Err(ApiError::new("File must not be empty", 400));
    }
    drop(field);
    if payload
        .try_next()
        .await
        .map_err(|err| ApiError::new(err.to_string(), 400))?
        .is_some()
    {
        return Err(ApiError::new("Upload exactly one file per request", 400));
    }

    let file_id = shared::cloud_storage::php_uploader::upload_file_bytes_to_php_uploader(
        bytes.freeze(),
        &filename,
        content_type.as_deref(),
        namespace,
        &claims.sub.to_string(),
    )
    .await
    .map_err(|err| {
        log::error!("PHP upload failed: {err}");
        ApiError::new("File upload failed", 502)
    })?;

    let url = shared::cloud_storage::php_uploader::file_url(&file_id).map_err(|err| {
        log::error!("PHP file URL configuration failed: {err}");
        ApiError::new("File URL is not configured", 500)
    })?;

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

async fn upload_quotation_handler(
    payload: Multipart,
    claims: JwtClaims,
) -> Result<ApiResponse<UploadedFileDTO>, ApiError> {
    require_role(&claims, STAFF)?;
    upload_to_namespace(payload, claims, "quotations").await
}

async fn upload_expense_receipt_handler(
    payload: Multipart,
    claims: JwtClaims,
) -> Result<ApiResponse<UploadedFileDTO>, ApiError> {
    require_role(&claims, STAFF)?;
    upload_to_namespace(payload, claims, "expense-receipts").await
}

async fn upload_support_attachment_handler(
    payload: Multipart,
    claims: JwtClaims,
) -> Result<ApiResponse<UploadedFileDTO>, ApiError> {
    upload_to_namespace(payload, claims, "support-attachments").await
}

async fn upload_reward_image_handler(
    payload: Multipart,
    claims: JwtClaims,
) -> Result<ApiResponse<UploadedFileDTO>, ApiError> {
    require_role(&claims, ADMIN_ONLY)?;
    upload_to_namespace(payload, claims, "reward-images").await
}

fn require_role(claims: &JwtClaims, roles: &[&str]) -> Result<(), ApiError> {
    if !roles.contains(&claims.role.as_str()) {
        return Err(ApiError::new("Forbidden", 403));
    }
    Ok(())
}

pub fn uploads_routes(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/uploads")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, &[]).await
            }))
            .route(
                "/profile-image",
                web::post().to(upload_profile_image_handler),
            )
            .route(
                "/booking-document",
                web::post().to(upload_booking_document_handler),
            )
            .route(
                "/visa-document",
                web::post().to(upload_visa_document_handler),
            )
            .route("/quotation", web::post().to(upload_quotation_handler))
            .route(
                "/expense-receipt",
                web::post().to(upload_expense_receipt_handler),
            )
            .route(
                "/support-attachment",
                web::post().to(upload_support_attachment_handler),
            )
            .route("/reward-image", web::post().to(upload_reward_image_handler)),
    );
}

#[cfg(test)]
mod tests {
    use super::*;
    use actix_web::{http::StatusCode, test, App, HttpMessage};
    use std::io::{Read, Write};
    use uuid::Uuid;

    fn multipart(name: &str, data: &str) -> String {
        format!("--boundary\r\nContent-Disposition: form-data; name=\"{name}\"; filename=\"receipt.pdf\"\r\nContent-Type: application/pdf\r\n\r\n{data}\r\n--boundary--\r\n")
    }

    #[actix_web::test]
    async fn validates_and_forwards_uploads() {
        let owner = Uuid::new_v4();
        let app = test::init_service(
            App::new()
                .route("/document", web::post().to(upload_booking_document_handler))
                .route("/quotation", web::post().to(upload_quotation_handler))
                .route("/receipt", web::post().to(upload_expense_receipt_handler))
                .route("/reward", web::post().to(upload_reward_image_handler))
                .route(
                    "/support",
                    web::post().to(upload_support_attachment_handler),
                ),
        )
        .await;
        let send = |path: &str, body: String, role: &str| {
            let req = test::TestRequest::post()
                .uri(path)
                .insert_header(("Content-Type", "multipart/form-data; boundary=boundary"))
                .set_payload(body)
                .to_request();
            req.extensions_mut().insert(JwtClaims {
                sub: owner,
                role: role.to_string(),
                exp: usize::MAX,
                iat: 0,
            });
            req
        };
        for (body, status) in [
            ("--boundary--\r\n".to_string(), StatusCode::BAD_REQUEST),
            (multipart("other", "test"), StatusCode::BAD_REQUEST),
            (multipart("file", ""), StatusCode::BAD_REQUEST),
            (
                multipart("file", &"a".repeat(MAX_FILE_SIZE + 1)),
                StatusCode::PAYLOAD_TOO_LARGE,
            ),
            (
                multipart("file", "one").replace("--boundary--\r\n", &multipart("file", "two")),
                StatusCode::BAD_REQUEST,
            ),
        ] {
            let response = test::call_service(&app, send("/document", body, "customer")).await;
            assert_eq!(response.status(), status);
        }
        for (path, role) in [
            ("/quotation", "customer"),
            ("/receipt", "customer"),
            ("/reward", "employee"),
        ] {
            let response =
                test::call_service(&app, send(path, multipart("file", "test"), role)).await;
            assert_eq!(response.status(), StatusCode::FORBIDDEN);
        }

        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let base = format!("http://{}", listener.local_addr().unwrap());
        std::env::set_var("PHP_UPLOADER_BASE_URL", &base);
        std::env::set_var("PHP_UPLOADER_UPLOAD_URL", format!("{base}/upload.php"));
        std::env::set_var("PHP_UPLOADER_TOKEN", "test-upload-token");
        let file_id = Uuid::new_v4().to_string();
        let expected_id = file_id.clone();
        let server = std::thread::spawn(move || {
            for namespace in [
                "booking-documents",
                "quotations",
                "expense-receipts",
                "support-attachments",
                "reward-images",
            ] {
                let (mut stream, _) = listener.accept().unwrap();
                stream
                    .set_read_timeout(Some(std::time::Duration::from_secs(10)))
                    .unwrap();
                let mut request = Vec::new();
                let mut buf = [0; 4096];
                loop {
                    let n = stream.read(&mut buf).unwrap();
                    assert!(n > 0);
                    request.extend_from_slice(&buf[..n]);
                    if let Some(end) = request.windows(4).position(|w| w == b"\r\n\r\n") {
                        let headers = String::from_utf8_lossy(&request[..end]).to_lowercase();
                        let length: usize = headers
                            .lines()
                            .find_map(|line| line.strip_prefix("content-length: "))
                            .unwrap()
                            .parse()
                            .unwrap();
                        if request.len() >= end + 4 + length {
                            break;
                        }
                    }
                }
                let request = String::from_utf8(request).unwrap();
                assert!(request.starts_with("POST /upload.php HTTP/1.1"));
                assert!(request
                    .to_lowercase()
                    .contains("x-upload-token: test-upload-token"));
                assert!(request.contains(namespace));
                assert!(request.contains(&owner.to_string()));
                assert!(request.contains("application/pdf"));
                assert!(request.contains("%PDF-test"));
                let response = format!(r#"{{"success":true,"id":"{expected_id}"}}"#);
                write!(stream, "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}", response.len(), response).unwrap();
            }
        });
        for (path, role) in [
            ("/document", "customer"),
            ("/quotation", "employee"),
            ("/receipt", "admin"),
            ("/support", "customer"),
            ("/reward", "super_admin"),
        ] {
            let response =
                test::call_service(&app, send(path, multipart("file", "%PDF-test"), role)).await;
            assert_eq!(response.status(), StatusCode::OK);
            let json: serde_json::Value = test::read_body_json(response).await;
            assert_eq!(json["data"]["file_id"], file_id);
            assert_eq!(json["data"]["url"], format!("{base}/file.php?id={file_id}"));
        }
        server.join().unwrap();
        std::env::remove_var("PHP_UPLOADER_BASE_URL");
        std::env::remove_var("PHP_UPLOADER_UPLOAD_URL");
        std::env::remove_var("PHP_UPLOADER_TOKEN");
    }
}
