use std::error::Error;

use reqwest::header::CONTENT_TYPE;
use reqwest::multipart::{Form, Part};
use serde::Deserialize;
use uuid::Uuid;

fn env_required_any(keys: &[&str]) -> Result<String, String> {
    keys.iter()
        .find_map(|key| std::env::var(key).ok())
        .map(|value| value.trim().trim_end_matches('/').to_string())
        .filter(|value| !value.is_empty())
        .ok_or_else(|| {
            format!(
                "Missing required environment variable. Set one of: {}",
                keys.join(", ")
            )
        })
}

fn env_optional(key: &str) -> Option<String> {
    std::env::var(key)
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn upload_url() -> Result<String, String> {
    if let Some(url) = env_optional("PHP_UPLOADER_UPLOAD_URL") {
        return Ok(url);
    }

    let base_url = env_required_any(&["PHP_UPLOADER_BASE_URL"])?;
    Ok(format!("{}/upload.php", base_url))
}

pub fn file_url(file_id: &str) -> Result<String, String> {
    let base_url = env_required_any(&["PHP_UPLOADER_BASE_URL"])?;
    Ok(format!("{}/file.php?id={}", base_url, file_id))
}

fn is_http_url(value: &str) -> bool {
    value.starts_with("http://") || value.starts_with("https://")
}

fn original_filename_from_url(file_url: &str) -> String {
    let without_query = file_url.split('?').next().unwrap_or(file_url);
    without_query
        .rsplit('/')
        .next()
        .filter(|part| !part.trim().is_empty())
        .unwrap_or("file.bin")
        .to_string()
}

fn filename_extension(filename: &str) -> &str {
    filename.rsplit('.').next().unwrap_or("bin")
}

fn uuid_filename(file_id: &str, original_filename: &str) -> String {
    let ext = filename_extension(original_filename)
        .trim()
        .trim_start_matches('.')
        .to_lowercase();

    if ext.is_empty() {
        return file_id.to_string();
    }

    format!("{}.{}", file_id, ext)
}

#[derive(Debug, Deserialize)]
struct PhpUploadResponse {
    success: bool,
    id: Option<String>,
    message: Option<String>,
}

pub async fn upload_external_file_to_php_uploader_if_needed(
    file_url: &str,
    key_namespace: &str,
    owner_id: &str,
) -> Result<String, String> {
    dotenv::dotenv().ok();

    let input_url = file_url.trim();
    if input_url.is_empty() || !is_http_url(input_url) {
        return Ok(file_url.to_string());
    }

    let client = reqwest::Client::new();
    let response = client.get(input_url).send().await.map_err(|error| {
        format!("Failed to fetch file URL '{}': {}", input_url, error)
    })?;

    if !response.status().is_success() {
        return Err(format!(
            "Failed to fetch file URL '{}': HTTP {}",
            input_url,
            response.status()
        ));
    }

    let content_type = response
        .headers()
        .get(CONTENT_TYPE)
        .and_then(|header| header.to_str().ok())
        .map(|value| value.to_string());
    let body = response.bytes().await.map_err(|error| {
        format!("Failed to read file bytes from '{}': {}", input_url, error)
    })?;
    let source_filename = original_filename_from_url(input_url);

    upload_file_bytes_to_php_uploader(
        body,
        &source_filename,
        content_type.as_deref(),
        key_namespace,
        owner_id,
    )
    .await
}

pub async fn upload_file_bytes_to_php_uploader(
    body: bytes::Bytes,
    original_filename: &str,
    content_type: Option<&str>,
    key_namespace: &str,
    owner_id: &str,
) -> Result<String, String> {
    dotenv::dotenv().ok();

    let file_id = Uuid::new_v4().to_string();
    let filename = uuid_filename(&file_id, original_filename);
    let mut part = Part::bytes(body.to_vec()).file_name(filename);

    if let Some(content_type) = content_type {
        part = part.mime_str(content_type).map_err(|error| {
            format!(
                "Invalid content type '{}' for PHP uploader: {}",
                content_type, error
            )
        })?;
    }

    let form = Form::new()
        .text("file_id", file_id.clone())
        .text("namespace", key_namespace.to_string())
        .text("owner_id", owner_id.to_string())
        .part("file", part);

    let mut request =
        reqwest::Client::new().post(upload_url()?).multipart(form);
    if let Some(token) = env_optional("PHP_UPLOADER_TOKEN") {
        request = request.header("X-Upload-Token", token);
    }

    let response = request.send().await.map_err(|error| {
        format!(
            "Failed to call PHP uploader:\n{:?}\nSource: {:?}",
            error,
            error.source()
        )
    })?;
    let status = response.status();
    let body = response.text().await.map_err(|error| {
        format!("Failed to read PHP uploader response: {}", error)
    })?;

    if !status.is_success() {
        return Err(format!("PHP uploader returned HTTP {}: {}", status, body));
    }

    let parsed: PhpUploadResponse =
        serde_json::from_str(&body).map_err(|error| {
            format!("Invalid PHP uploader JSON response: {} ({})", error, body)
        })?;

    if !parsed.success {
        return Err(parsed
            .message
            .unwrap_or_else(|| "PHP uploader rejected the file".to_string()));
    }

    parsed.id.filter(|id| !id.trim().is_empty()).ok_or_else(|| {
        "PHP uploader response did not include file id".to_string()
    })
}
