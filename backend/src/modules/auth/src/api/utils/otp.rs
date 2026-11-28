//! One-time codes for joining and resetting a forgotten passcode.

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

/// Sends a code by SMS, with the existing account email fallback.
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

    if shared::twilio::verify_configured() {
        match shared::twilio::send_code(phone).await {
            Ok(()) => {
                insert_request(pool, phone, purpose, "twilio", None).await?;
                return Ok(OtpSent { channel: "sms", dev_code: None });
            }
            Err(err) => log::error!("Twilio Verify could not send a code to {phone}: {err}"),
        }
    }

    let code = generate_code();
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
    // Every live code counts, including a code that arrived just after a resend.
    let live: Vec<(Uuid, String, Option<String>)> = sqlx::query_as(
        r#"SELECT id, channel, code_hash FROM otp_requests
           WHERE phone = $1 AND purpose = $2 AND consumed_at IS NULL AND expires_at > NOW()
           ORDER BY created_at DESC LIMIT 10"#,
    )
    .bind(phone)
    .bind(purpose.as_str())
    .fetch_all(pool)
    .await
    .map_err(db_err)?;
    // Attempts are counted on the newest request (a resend starts a fresh count, as before).
    let Some((id, _, _)) = live.first() else {
        return Err(invalid());
    };
    let id = *id;

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

    // Our own codes (e-mail or previously issued codes) first: no network call. Then Twilio Verify, if an SMS went out.
    let hash = code_hash(code, phone, purpose);
    let mut approved = live
        .iter()
        .any(|(_, channel, stored)| channel == "local" && stored.as_deref() == Some(hash.as_str()));
    if !approved && live.iter().any(|(_, channel, _)| channel == "twilio") {
        approved = shared::twilio::check_code(phone, code).await.map_err(|err| {
            log::error!("Twilio Verify check failed for {phone}: {err}");
            ApiError::new("We couldn't check your code right now. Please try again.", 503)
        })?;
    }
    if !approved {
        return Err(invalid());
    }

    // Used once: consuming every live code means an earlier code can't be used
    // later, and of two parallel correct submissions only the first wins.
    let ids: Vec<Uuid> = live.iter().map(|(id, _, _)| *id).collect();
    let consumed = sqlx::query("UPDATE otp_requests SET consumed_at = NOW() WHERE id = ANY($1) AND consumed_at IS NULL")
        .bind(&ids)
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

}
