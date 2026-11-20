//! One-time codes (6 digits) for joining and for resetting a forgotten passcode.
//!
//! Delivery order: WhatsApp template with a locally generated code (falls back when Twilio reports
//! it failed/undelivered; resends skip it) -> Twilio Verify SMS -> e-mail with a local code (only
//! when the account has an e-mail address) -> error. With `OTP_DEV_ECHO=true` (local development
//! only) a local code is also returned in the API response.

use base::constants::PASSWORD_HASH_SECRET;
use base::error::ApiError;
use chrono::{DateTime, Duration, Utc};
use rand::Rng;
use sha2::{Digest, Sha256};
use sqlx::PgPool;
use uuid::Uuid;

/// Must match the code length set on the Twilio Verify Service (Console -> Verify -> Services).
pub const OTP_LENGTH: usize = 6;
const OTP_TTL_MINUTES: i64 = 10;
const OTP_MAX_ATTEMPTS: i32 = 5;
const OTP_RESEND_SECONDS: i64 = 60;

/// Codes prove the member owns the phone: when joining, and when resetting a forgotten passcode.
/// Signing in itself uses the 4-digit passcode, not a code.
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum OtpPurpose {
    Register,
    Reset,
}

impl OtpPurpose {
    pub fn as_str(self) -> &'static str {
        match self {
            OtpPurpose::Register => "register",
            // ponytail: stored as 'login' (the "existing account" value the 0034 CHECK allows),
            // so no migration is needed to rename it.
            OtpPurpose::Reset => "login",
        }
    }
}

/// What the client is told after a code was sent.
pub struct OtpSent {
    /// "whatsapp", "sms", "email", or "dev" (development echo).
    pub channel: &'static str,
    /// Only with OTP_DEV_ECHO=true on a local machine.
    pub dev_code: Option<String>,
}

fn db_err(e: sqlx::Error) -> ApiError {
    base::error::internal(e)
}

fn code_hash(code: &str, phone: &str, purpose: OtpPurpose) -> String {
    let mut hasher = Sha256::new();
    for part in [code, phone, purpose.as_str()] {
        hasher.update(part.as_bytes());
        hasher.update([0u8]);
    }
    hasher.update(PASSWORD_HASH_SECRET.as_bytes());
    hex::encode(hasher.finalize())
}

fn dev_echo() -> bool {
    std::env::var("OTP_DEV_ECHO").map(|v| v == "true").unwrap_or(false)
}

pub fn is_valid_otp_format(code: &str) -> bool {
    code.len() == OTP_LENGTH && code.chars().all(|c| c.is_ascii_digit())
}

async fn insert_request(
    pool: &PgPool,
    phone: &str,
    purpose: OtpPurpose,
    channel: &str,
    hash: Option<String>,
) -> Result<(), ApiError> {
    sqlx::query(
        "INSERT INTO otp_requests (phone, purpose, channel, code_hash, expires_at) VALUES ($1, $2, $3, $4, $5)",
    )
    .bind(phone)
    .bind(purpose.as_str())
    .bind(channel)
    .bind(hash)
    .bind(Utc::now() + Duration::minutes(OTP_TTL_MINUTES))
    .execute(pool)
    .await
    .map_err(db_err)?;
    Ok(())
}

fn generate_code() -> String {
    format!("{:0width$}", rand::thread_rng().gen_range(0..10_u32.pow(OTP_LENGTH as u32)), width = OTP_LENGTH)
}

/// How a WhatsApp status settles the send: `Some(true)` reached the phone, `Some(false)` failed
/// (fall back to SMS), `None` still on its way.
fn whatsapp_outcome(status: &str) -> Option<bool> {
    match status {
        "delivered" | "read" => Some(true),
        "failed" | "undelivered" => Some(false),
        _ => None,
    }
}

const WHATSAPP_STATUS_CHECKS: u32 = 8;

/// Sends `code` by WhatsApp and watches the status for a few seconds. A number without WhatsApp
/// (or a template problem) fails within a second or two. A message still "sent" after the wait
/// (phone offline) is accepted; "Resend code" then goes by SMS.
async fn send_whatsapp(phone: &str, code: &str) -> Result<(), String> {
    let sid = shared::twilio::send_whatsapp_code(phone, code).await?;
    for _ in 0..WHATSAPP_STATUS_CHECKS {
        actix_web::rt::time::sleep(std::time::Duration::from_secs(1)).await;
        match shared::twilio::whatsapp_status(&sid).await {
            Ok((status, error_code)) => match whatsapp_outcome(&status) {
                Some(true) => return Ok(()),
                Some(false) => return Err(format!("message {sid} {status} (error {error_code:?})")),
                None => {}
            },
            // Can't read the status: the message was accepted, so don't send a second code.
            Err(err) => {
                log::warn!("Could not read WhatsApp status of {sid}: {err}");
                return Ok(());
            }
        }
    }
    Ok(())
}

/// Sends a code to `phone` (stored form). `email` is the account's address for the fallback.
/// Order: WhatsApp (first send only) -> SMS via Twilio Verify -> e-mail.
pub async fn send_code(
    pool: &PgPool,
    phone: &str,
    purpose: OtpPurpose,
    email: Option<&str>,
) -> Result<OtpSent, ApiError> {
    let recent: Option<DateTime<Utc>> = sqlx::query_scalar(
        "SELECT created_at FROM otp_requests WHERE phone = $1 AND purpose = $2 ORDER BY created_at DESC LIMIT 1",
    )
    .bind(phone)
    .bind(purpose.as_str())
    .fetch_optional(pool)
    .await
    .map_err(db_err)?;
    if recent.is_some_and(|at| Utc::now() - at < Duration::seconds(OTP_RESEND_SECONDS)) {
        return Err(ApiError::new("Please wait a minute before requesting another code", 429));
    }

    // A live, unused code already exists, so this is "Resend code": the first message may not have
    // reached them on WhatsApp, so the resend goes by SMS.
    let is_resend: bool = sqlx::query_scalar(
        "SELECT EXISTS (SELECT 1 FROM otp_requests WHERE phone = $1 AND purpose = $2 AND consumed_at IS NULL AND expires_at > NOW())",
    )
    .bind(phone)
    .bind(purpose.as_str())
    .fetch_one(pool)
    .await
    .map_err(db_err)?;

    // Our own code: used for WhatsApp and the e-mail fallback (SMS via Verify makes its own).
    let code = generate_code();

    if !is_resend && shared::twilio::whatsapp_configured() {
        match send_whatsapp(phone, &code).await {
            Ok(()) => {
                // ponytail: stored as channel 'local' (we hold the hash), the value the 0034 CHECK allows.
                insert_request(pool, phone, purpose, "local", Some(code_hash(&code, phone, purpose))).await?;
                return Ok(OtpSent { channel: "whatsapp", dev_code: dev_echo().then(|| code.clone()) });
            }
            Err(err) => log::warn!("WhatsApp code to {phone} failed, falling back to SMS: {err}"),
        }
    }

    if shared::twilio::verify_configured() {
        match shared::twilio::send_code(phone).await {
            Ok(()) => {
                insert_request(pool, phone, purpose, "twilio", None).await?;
                return Ok(OtpSent { channel: "sms", dev_code: None });
            }
            Err(err) => log::error!("Twilio Verify could not send a code to {phone}: {err}"),
        }
    }

    // Fallback: our own code, by e-mail (or echoed back on a development machine).
    let mut channel = None;
    if let Some(email) = email {
        let to = email.to_string();
        let body = format!(
            "{code} is your Bright Wings sign-in code. It expires in {OTP_TTL_MINUTES} minutes. Never share it with anyone."
        );
        match actix_web::web::block(move || shared::mail::send_plain_email(&to, "Your Bright Wings sign-in code", &body)).await {
            Ok(Ok(())) => channel = Some("email"),
            Ok(Err(err)) => log::error!("Sign-in code e-mail failed: {err}"),
            Err(err) => log::error!("Sign-in code e-mail task failed: {err}"),
        }
    }
    let dev_code = dev_echo().then(|| code.clone());
    let Some(channel) = channel.or(dev_code.as_ref().map(|_| "dev")) else {
        log::warn!("Sign-in code for {phone} could not be delivered (configure TWILIO_* or SMTP_*)");
        return Err(ApiError::new("We couldn't send your code right now. Please try again in a few minutes.", 503));
    };
    insert_request(pool, phone, purpose, "local", Some(code_hash(&code, phone, purpose))).await?;
    Ok(OtpSent { channel, dev_code })
}

/// Checks `code` against the latest live request for `phone` and marks it used.
pub async fn check_code(pool: &PgPool, phone: &str, purpose: OtpPurpose, code: &str) -> Result<(), ApiError> {
    let invalid = || ApiError::new("That code is incorrect or has expired", 400);
    if !is_valid_otp_format(code) {
        return Err(invalid());
    }
    let request: Option<(Uuid, String, Option<String>)> = sqlx::query_as(
        r#"SELECT id, channel, code_hash FROM otp_requests
           WHERE phone = $1 AND purpose = $2 AND consumed_at IS NULL AND expires_at > NOW()
           ORDER BY created_at DESC LIMIT 1"#,
    )
    .bind(phone)
    .bind(purpose.as_str())
    .fetch_optional(pool)
    .await
    .map_err(db_err)?;
    let Some((id, channel, stored_hash)) = request else {
        return Err(invalid());
    };

    // Claim an attempt atomically, so parallel guesses cannot all slip under the limit.
    let claimed: Option<i32> = sqlx::query_scalar(
        "UPDATE otp_requests SET attempts = attempts + 1 WHERE id = $1 AND attempts < $2 RETURNING attempts",
    )
    .bind(id)
    .bind(OTP_MAX_ATTEMPTS)
    .fetch_optional(pool)
    .await
    .map_err(db_err)?;
    if claimed.is_none() {
        return Err(ApiError::new("Too many attempts. Please request a new code", 429));
    }

    let approved = if channel == "twilio" {
        shared::twilio::check_code(phone, code).await.map_err(|err| {
            log::error!("Twilio Verify check failed for {phone}: {err}");
            ApiError::new("We couldn't check your code right now. Please try again.", 503)
        })?
    } else {
        stored_hash.as_deref() == Some(code_hash(code, phone, purpose).as_str())
    };
    if !approved {
        return Err(invalid());
    }

    // Used once: only the request that just passed can be consumed, and only one caller wins.
    let consumed = sqlx::query("UPDATE otp_requests SET consumed_at = NOW() WHERE id = $1 AND consumed_at IS NULL")
        .bind(id)
        .execute(pool)
        .await
        .map_err(db_err)?;
    if consumed.rows_affected() == 0 {
        return Err(invalid());
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn otp_format() {
        assert!(is_valid_otp_format("042113"));
        assert!(!is_valid_otp_format("0421"));
        assert!(!is_valid_otp_format("0421135"));
        assert!(!is_valid_otp_format("04a113"));
    }

    #[test]
    fn generated_codes_have_the_right_length() {
        for _ in 0..100 {
            assert!(is_valid_otp_format(&generate_code()));
        }
    }

    #[test]
    fn whatsapp_statuses() {
        assert_eq!(whatsapp_outcome("delivered"), Some(true));
        assert_eq!(whatsapp_outcome("read"), Some(true));
        assert_eq!(whatsapp_outcome("failed"), Some(false));
        assert_eq!(whatsapp_outcome("undelivered"), Some(false));
        assert_eq!(whatsapp_outcome("sent"), None);
        assert_eq!(whatsapp_outcome("queued"), None);
    }
}
