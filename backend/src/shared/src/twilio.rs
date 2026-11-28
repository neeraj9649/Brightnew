//! Twilio Verify SMS and WhatsApp enquiry notifications.

use std::time::Duration;

const VERIFY_BASE: &str = "https://verify.twilio.com/v2/Services";
const MESSAGES_BASE: &str = "https://api.twilio.com/2010-04-01/Accounts";
const CONTENT_BASE: &str = "https://content.twilio.com/v1/Content";
/// Bright Wings' WhatsApp sender (connected in WhatsApp Manager and Twilio).
const DEFAULT_WHATSAPP_FROM: &str = "+919252153290";
const TOUR_ENQUIRY_CONTENT_SID: &str = "HX3a61dfb446ff277339f7524eda4c26be";
const TOUR_GREETING_CONTENT_SID: &str = "HXa35576af9f780a4216a7dd8b1c351c47";

struct Credentials {
    account_sid: String,
    auth_token: String,
}

fn env_optional(key: &str) -> Option<String> {
    dotenv::dotenv().ok();
    std::env::var(key).ok().map(|v| v.trim().to_string()).filter(|v| !v.is_empty())
}

fn credentials() -> Option<Credentials> {
    Some(Credentials {
        account_sid: env_optional("TWILIO_ACCOUNT_SID")?,
        auth_token: env_optional("TWILIO_AUTH_TOKEN")?,
    })
}

fn verify_service_sid() -> Option<String> {
    env_optional("TWILIO_VERIFY_SERVICE_SID")
}

pub fn verify_configured() -> bool {
    credentials().is_some() && verify_service_sid().is_some()
}

/// Stored phones are bare 10 digits for India and `+<country><number>` for everyone else;
/// Twilio needs E.164 for all of them.
pub fn to_e164(stored_phone: &str) -> String {
    if stored_phone.starts_with('+') {
        stored_phone.to_string()
    } else {
        format!("+91{stored_phone}")
    }
}

/// `application/x-www-form-urlencoded` value encoding (a `+` in a phone number must become `%2B`).
fn form_encode(pairs: &[(&str, &str)]) -> String {
    let encode = |value: &str| {
        value
            .bytes()
            .map(|b| match b {
                b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => (b as char).to_string(),
                _ => format!("%{b:02X}"),
            })
            .collect::<String>()
    };
    pairs.iter().map(|(k, v)| format!("{}={}", encode(k), encode(v))).collect::<Vec<_>>().join("&")
}

/// POST a form (`Some(pairs)`) or GET (`None`) to a Twilio URL with Basic auth.
async fn call(url: &str, form: Option<&[(&str, &str)]>) -> Result<serde_json::Value, String> {
    let creds = credentials().ok_or("Twilio is not configured")?;
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;
    let request = match form {
        Some(pairs) => client
            .post(url)
            .header(reqwest::header::CONTENT_TYPE, "application/x-www-form-urlencoded")
            .body(form_encode(pairs)),
        None => client.get(url),
    };
    let response = request
        .basic_auth(&creds.account_sid, Some(&creds.auth_token))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let status = response.status();
    let body: serde_json::Value = serde_json::from_str(&response.text().await.unwrap_or_default()).unwrap_or_default();
    if status.is_success() {
        Ok(body)
    } else {
        // Twilio error bodies carry `code` and `message` (e.g. 60200 invalid number, 60203 too many sends).
        Err(format!("Twilio {status}: {} {}", body["code"], body["message"]))
    }
}

async fn verify_post(path: &str, pairs: &[(&str, &str)]) -> Result<serde_json::Value, String> {
    let service_sid = verify_service_sid().ok_or("Twilio Verify is not configured")?;
    call(&format!("{VERIFY_BASE}/{service_sid}/{path}"), Some(pairs)).await
}

/// Sends a new code by SMS to `stored_phone` (Twilio Verify generates and later checks it).
pub async fn send_code(stored_phone: &str) -> Result<(), String> {
    let to = to_e164(stored_phone);
    verify_post("Verifications", &[("To", to.as_str()), ("Channel", "sms")]).await.map(|_| ())
}

/// `Ok(true)` when Twilio approves `code` for `stored_phone`. A wrong code is `Ok(false)`;
/// an expired, already-used or unknown verification comes back from Twilio as a 404, which is
/// also treated as "not approved".
pub async fn check_code(stored_phone: &str, code: &str) -> Result<bool, String> {
    let to = to_e164(stored_phone);
    match verify_post("VerificationCheck", &[("To", to.as_str()), ("Code", code)]).await {
        Ok(body) => Ok(body["status"] == "approved"),
        Err(err) if err.starts_with("Twilio 404") => Ok(false),
        Err(err) => Err(err),
    }
}

fn enquiry_verify_service() -> Result<String, String> {
    let sid = env_optional("ENQUIRY_VERIFY_SERVICE_SID").ok_or("Enquiry Verify service is not configured")?;
    if verify_service_sid().as_deref() == Some(sid.as_str()) {
        return Err("Enquiry Verify service must be separate from account verification".into());
    }
    if sid.len() != 34 || !sid.strip_prefix("VA").is_some_and(|part| part.bytes().all(|byte| byte.is_ascii_hexdigit())) {
        return Err("Invalid enquiry Verify service SID".into());
    }
    Ok(sid)
}

pub async fn send_enquiry_code(phone: &str) -> Result<String, String> {
    let service = enquiry_verify_service()?;
    let result = call(&format!("{VERIFY_BASE}/{service}/Verifications"), Some(&[("To", phone), ("Channel", "sms")])).await?;
    result["sid"].as_str().map(str::to_owned).ok_or_else(|| "Twilio returned no verification SID".into())
}

pub async fn check_enquiry_code(sid: &str, code: &str) -> Result<bool, String> {
    let service = enquiry_verify_service()?;
    match call(&format!("{VERIFY_BASE}/{service}/VerificationCheck"), Some(&[("VerificationSid", sid), ("Code", code)])).await {
        Ok(result) => Ok(result["status"] == "approved"),
        Err(error) if error.starts_with("Twilio 404") => Ok(false),
        Err(error) => Err(error),
    }
}

/// Notifies the office of a verified enquiry with the approved WhatsApp template.
pub async fn send_tour_enquiry_whatsapp(fields: [&str; 6]) -> Result<String, String> {
    let content_sid = env_optional("WHATSAPP_TOUR_ENQUIRY_CONTENT_SID")
        .unwrap_or_else(|| TOUR_ENQUIRY_CONTENT_SID.into());
    require_whatsapp_approval(&content_sid).await?;
    send_whatsapp_content("+917732957732", &content_sid, &fields).await
}

pub async fn approved_tour_greeting_template() -> Result<String, String> {
    let content_sid = env_optional("WHATSAPP_TOUR_GREETING_CONTENT_SID")
        .unwrap_or_else(|| TOUR_GREETING_CONTENT_SID.into());
    require_whatsapp_approval(&content_sid).await?;
    Ok(content_sid)
}

pub async fn send_tour_greeting_whatsapp(to: &str, name: &str, approved_content_sid: &str) -> Result<String, String> {
    send_whatsapp_content(to, approved_content_sid, &[name]).await
}

async fn require_whatsapp_approval(content_sid: &str) -> Result<(), String> {
    if content_sid.len() != 34
        || !content_sid.strip_prefix("HX").is_some_and(|suffix| suffix.bytes().all(|b| b.is_ascii_hexdigit()))
    {
        return Err("Invalid WhatsApp tour Content SID".into());
    }
    let approval = call(&format!("{CONTENT_BASE}/{content_sid}/ApprovalRequests"), None).await?;
    let status = approval["whatsapp"]["status"].as_str().unwrap_or("unsubmitted");
    if !status.eq_ignore_ascii_case("approved") {
        return Err(format!("WhatsApp template {content_sid} is {status}"));
    }
    Ok(())
}

async fn send_whatsapp_content(to: &str, content_sid: &str, fields: &[&str]) -> Result<String, String> {
    let creds = credentials().ok_or("Twilio is not configured")?;
    let from = format!("whatsapp:{DEFAULT_WHATSAPP_FROM}");
    let to = format!("whatsapp:{to}");
    let variables: serde_json::Map<String, serde_json::Value> = fields
        .iter()
        .enumerate()
        .map(|(i, value)| ((i + 1).to_string(), value.split_whitespace().collect::<Vec<_>>().join(" ").into()))
        .collect();
    let variables = serde_json::Value::Object(variables).to_string();
    let body = call(
        &format!("{MESSAGES_BASE}/{}/Messages.json", creds.account_sid),
        Some(&[
            ("From", from.as_str()),
            ("To", to.as_str()),
            ("ContentSid", content_sid),
            ("ContentVariables", variables.as_str()),
        ]),
    )
    .await?;
    whatsapp_message_sid(&body)
}

fn whatsapp_message_sid(body: &serde_json::Value) -> Result<String, String> {
    if matches!(body["status"].as_str(), Some("failed" | "undelivered" | "canceled")) {
        return Err(format!("Twilio rejected the WhatsApp message (code {})", body["error_code"]));
    }
    body["sid"].as_str().map(str::to_string).ok_or_else(|| "Twilio returned no message SID".into())
}

/// Current status of a sent message: queued, sending, sent, delivered, read, failed or undelivered,
/// plus Twilio's error code when there is one.
pub async fn whatsapp_status(message_sid: &str) -> Result<(String, Option<i64>), String> {
    let creds = credentials().ok_or("Twilio is not configured")?;
    let url = format!("{MESSAGES_BASE}/{}/Messages/{message_sid}.json", creds.account_sid);
    let body = call(&url, None).await?;
    Ok((body["status"].as_str().unwrap_or_default().to_string(), body["error_code"].as_i64()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_failed_whatsapp_response_is_not_counted_as_sent() {
        for status in ["failed", "undelivered", "canceled"] {
            let result = whatsapp_message_sid(&serde_json::json!({ "sid": "SMtest", "status": status }));
            assert!(result.is_err());
        }
        let result = whatsapp_message_sid(&serde_json::json!({ "sid": "SMtest", "status": "queued" }));
        assert_eq!(result.unwrap(), "SMtest");
    }

    #[test]
    fn phones_become_e164() {
        assert_eq!(to_e164("9876543210"), "+919876543210");
        assert_eq!(to_e164("+14155552671"), "+14155552671");
    }

    #[test]
    fn form_values_are_encoded() {
        assert_eq!(form_encode(&[("To", "+919876543210"), ("Channel", "sms")]), "To=%2B919876543210&Channel=sms");
        assert_eq!(
            form_encode(&[("To", "whatsapp:+918000192248"), ("ContentVariables", r#"{"1":"123456"}"#)]),
            "To=whatsapp%3A%2B918000192248&ContentVariables=%7B%221%22%3A%22123456%22%7D"
        );
    }
}
