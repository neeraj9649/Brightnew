//! Twilio Verify: Twilio generates, sends and checks the one-time sign-in code.
//!
//! Configured with `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` and `TWILIO_VERIFY_SERVICE_SID`.
//! The code length (6 digits, must equal `OTP_LENGTH` in auth/api/utils/otp.rs) and expiry are set on
//! the Verify Service in the Twilio Console,
//! not here.

use std::time::Duration;

const VERIFY_BASE: &str = "https://verify.twilio.com/v2/Services";

struct Config {
    account_sid: String,
    auth_token: String,
    service_sid: String,
}

fn env_optional(key: &str) -> Option<String> {
    dotenv::dotenv().ok();
    std::env::var(key).ok().map(|v| v.trim().to_string()).filter(|v| !v.is_empty())
}

fn config() -> Option<Config> {
    Some(Config {
        account_sid: env_optional("TWILIO_ACCOUNT_SID")?,
        auth_token: env_optional("TWILIO_AUTH_TOKEN")?,
        service_sid: env_optional("TWILIO_VERIFY_SERVICE_SID")?,
    })
}

/// True when all three Twilio settings are present.
pub fn verify_configured() -> bool {
    config().is_some()
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

async fn post(path: &str, pairs: &[(&str, &str)]) -> Result<serde_json::Value, String> {
    let cfg = config().ok_or("Twilio Verify is not configured")?;
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;
    let response = client
        .post(format!("{VERIFY_BASE}/{}/{path}", cfg.service_sid))
        .basic_auth(&cfg.account_sid, Some(&cfg.auth_token))
        .header(reqwest::header::CONTENT_TYPE, "application/x-www-form-urlencoded")
        .body(form_encode(pairs))
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

/// Sends a new code by SMS to `stored_phone`.
pub async fn send_code(stored_phone: &str) -> Result<(), String> {
    let to = to_e164(stored_phone);
    post("Verifications", &[("To", to.as_str()), ("Channel", "sms")]).await.map(|_| ())
}

/// `Ok(true)` when Twilio approves `code` for `stored_phone`. A wrong code is `Ok(false)`;
/// an expired, already-used or unknown verification comes back from Twilio as a 404, which is
/// also treated as "not approved".
pub async fn check_code(stored_phone: &str, code: &str) -> Result<bool, String> {
    let to = to_e164(stored_phone);
    match post("VerificationCheck", &[("To", to.as_str()), ("Code", code)]).await {
        Ok(body) => Ok(body["status"] == "approved"),
        Err(err) if err.starts_with("Twilio 404") => Ok(false),
        Err(err) => Err(err),
    }
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
    }
}
