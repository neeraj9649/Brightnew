//! Twilio: one-time codes by WhatsApp (Messages API + an approved authentication template)
//! and by SMS (Twilio Verify).
//!
//! Credentials: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`; SMS also needs `TWILIO_VERIFY_SERVICE_SID`.
//! The Verify code length (6 digits, must equal `OTP_LENGTH` in auth/api/utils/otp.rs) and expiry are
//! set on the Verify Service in the Twilio Console, not here.
//!
//! WhatsApp sender and template default to Bright Wings' own (below). `WHATSAPP_OTP_FROM` /
//! `WHATSAPP_OTP_CONTENT_SID` override them, and `WHATSAPP_OTP_FROM=off` turns WhatsApp off.
//! (Deliberately not `TWILIO_*`: the deploy workflow rewrites every `TWILIO_*` line of the server .env.)

use std::time::Duration;

const VERIFY_BASE: &str = "https://verify.twilio.com/v2/Services";
const MESSAGES_BASE: &str = "https://api.twilio.com/2010-04-01/Accounts";
/// Bright Wings' WhatsApp sender (connected in WhatsApp Manager and Twilio).
const DEFAULT_WHATSAPP_FROM: &str = "+919252153290";
/// Template `otp_code_whatsapp` (Authentication): "{{1}} is your verification code..." + Copy code button.
const DEFAULT_WHATSAPP_CONTENT_SID: &str = "HX611fe1a9d4dae2ff54ef7bfddaec21db";

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

/// (sender in E.164, template ContentSid), or None when WhatsApp is switched off.
fn whatsapp_sender() -> Option<(String, String)> {
    let from = env_optional("WHATSAPP_OTP_FROM").unwrap_or_else(|| DEFAULT_WHATSAPP_FROM.to_string());
    if from.eq_ignore_ascii_case("off") {
        return None;
    }
    let content_sid =
        env_optional("WHATSAPP_OTP_CONTENT_SID").unwrap_or_else(|| DEFAULT_WHATSAPP_CONTENT_SID.to_string());
    Some((from.trim_start_matches("whatsapp:").to_string(), content_sid))
}

/// True when the SMS path (Twilio Verify) has all three settings.
pub fn verify_configured() -> bool {
    credentials().is_some() && verify_service_sid().is_some()
}

/// True when codes can go out by WhatsApp (credentials present and WhatsApp not switched off).
pub fn whatsapp_configured() -> bool {
    credentials().is_some() && whatsapp_sender().is_some()
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

/// Sends `code` (generated and checked by us) through the WhatsApp authentication template.
/// Returns the message SID, for `whatsapp_status`.
pub async fn send_whatsapp_code(stored_phone: &str, code: &str) -> Result<String, String> {
    let creds = credentials().ok_or("Twilio is not configured")?;
    let (from, content_sid) = whatsapp_sender().ok_or("WhatsApp codes are switched off")?;
    let from = format!("whatsapp:{from}");
    let to = format!("whatsapp:{}", to_e164(stored_phone));
    let variables = serde_json::json!({ "1": code }).to_string();
    let url = format!("{MESSAGES_BASE}/{}/Messages.json", creds.account_sid);
    let body = call(
        &url,
        Some(&[
            ("From", from.as_str()),
            ("To", to.as_str()),
            ("ContentSid", content_sid.as_str()),
            ("ContentVariables", variables.as_str()),
        ]),
    )
    .await?;
    body["sid"].as_str().map(str::to_string).ok_or_else(|| "Twilio returned no message SID".to_string())
}

/// Sends a tour enquiry to Bright Wings' office using its approved notification template.
pub async fn send_tour_enquiry_whatsapp(fields: [&str; 6]) -> Result<String, String> {
    let content_sid = env_optional("WHATSAPP_TOUR_ENQUIRY_CONTENT_SID")
        .ok_or("WHATSAPP_TOUR_ENQUIRY_CONTENT_SID is not configured")?;
    if content_sid.len() != 34
        || !content_sid.strip_prefix("HX").is_some_and(|suffix| suffix.bytes().all(|b| b.is_ascii_hexdigit()))
    {
        return Err("Invalid WhatsApp tour enquiry Content SID".into());
    }
    let creds = credentials().ok_or("Twilio is not configured")?;
    let from = format!("whatsapp:{DEFAULT_WHATSAPP_FROM}");
    let variables: serde_json::Map<String, serde_json::Value> = fields
        .into_iter()
        .enumerate()
        .map(|(i, value)| ((i + 1).to_string(), value.split_whitespace().collect::<Vec<_>>().join(" ").into()))
        .collect();
    let variables = serde_json::Value::Object(variables).to_string();
    let body = call(
        &format!("{MESSAGES_BASE}/{}/Messages.json", creds.account_sid),
        Some(&[
            ("From", from.as_str()),
            ("To", "whatsapp:+917732957732"),
            ("ContentSid", content_sid.as_str()),
            ("ContentVariables", variables.as_str()),
        ]),
    )
    .await?;
    if matches!(body["status"].as_str(), Some("failed" | "undelivered" | "canceled")) {
        return Err(format!("Twilio rejected the notification (code {})", body["error_code"]));
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
