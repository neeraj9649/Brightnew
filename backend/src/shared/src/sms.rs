use reqwest::header::CONTENT_TYPE;

fn env_optional(key: &str) -> Option<String> {
    std::env::var(key).ok().map(|value| value.trim().to_string()).filter(|value| !value.is_empty())
}

/// True when an SMS gateway webhook has been configured.
pub fn sms_configured() -> bool {
    env_optional("SMS_WEBHOOK_URL").is_some()
}

/// Sends a text message through a configurable HTTP gateway.
///
/// `SMS_WEBHOOK_URL` receives `POST {"to": "<phone>", "message": "<text>"}`;
/// `SMS_WEBHOOK_TOKEN` (optional) is sent as a bearer token. Any provider that
/// can be fronted by a webhook (MSG91, Twilio Functions, a PHP relay on the
/// existing Hostinger box, ...) works without code changes.
pub async fn send_sms(to: &str, message: &str) -> Result<(), String> {
    let url = env_optional("SMS_WEBHOOK_URL").ok_or("SMS_WEBHOOK_URL not configured")?;
    let payload = serde_json::json!({ "to": to, "message": message }).to_string();
    let mut request = reqwest::Client::new()
        .post(url)
        .header(CONTENT_TYPE, "application/json")
        .body(payload);
    if let Some(token) = env_optional("SMS_WEBHOOK_TOKEN") {
        request = request.bearer_auth(token);
    }
    let response = request.send().await.map_err(|e| e.to_string())?;
    if !response.status().is_success() {
        return Err(format!("SMS gateway returned {}", response.status()));
    }
    Ok(())
}
