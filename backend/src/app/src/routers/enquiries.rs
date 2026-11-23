//! Website contact form (brightwingstravel.in / .com, the Go_Travel_Brightwings site).
//!
//! `POST /public/enquiries` is public (no sign-in). Each enquiry is saved in `enquiries`
//! (migration 0036) and then e-mailed to `ENQUIRY_TO_EMAIL` from the `ENQUIRY_SMTP_*`
//! mailbox, with Reply-To set to the visitor so staff can answer straight from the inbox.
//! Saving comes first, so an enquiry is never lost when the mail server is down.

use std::time::Duration;

use actix_web::{web, HttpRequest};
use chrono::{FixedOffset, Utc};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

use base::error::{ApiError, ApiResponse};

const DEFAULT_TO: &str = "info@brightwingstravel.in";
/// Enquiries one IP address may send per hour; stops a bot from flooding the inbox.
const MAX_PER_HOUR: u32 = 5;

#[derive(Debug, Deserialize)]
pub struct EnquiryDTO {
    pub name: String,
    pub email: String,
    pub phone: String,
    pub message: String,
    /// Which form sent it (e.g. "contact"). Optional.
    #[serde(default)]
    pub source: Option<String>,
    /// The page the visitor was on. Optional, for context in the e-mail.
    #[serde(default)]
    pub page_url: Option<String>,
}

struct Enquiry {
    name: String,
    email: String,
    phone: String,
    message: String,
    source: String,
    page_url: Option<String>,
}

fn plausible_email(value: &str) -> bool {
    let mut parts = value.split('@');
    matches!((parts.next(), parts.next(), parts.next()), (Some(l), Some(d), None) if !l.is_empty() && d.contains('.') && !d.starts_with('.') && !d.ends_with('.') && !value.contains(' '))
}

/// Checks and tidies the form. Error messages are shown to the visitor as-is.
fn validate(body: EnquiryDTO) -> Result<Enquiry, ApiError> {
    let name = body.name.trim().to_string();
    if name.is_empty() {
        return Err(ApiError::new("Please enter your name", 400));
    }
    if name.chars().count() > 100 || name.chars().any(char::is_control) {
        return Err(ApiError::new("Please enter a shorter name", 400));
    }

    let email = body.email.trim().to_lowercase();
    if email.len() > 200 || !plausible_email(&email) {
        return Err(ApiError::new("Please enter a valid e-mail address", 400));
    }

    let phone = body.phone.trim().to_string();
    let digits = phone.chars().filter(char::is_ascii_digit).count();
    let allowed = phone.chars().all(|c| c.is_ascii_digit() || " +-()".contains(c));
    if phone.len() > 30 || !allowed || !(7..=15).contains(&digits) {
        return Err(ApiError::new("Please enter a valid phone number", 400));
    }

    let message = body.message.trim().to_string();
    if message.is_empty() {
        return Err(ApiError::new("Please write a message", 400));
    }
    if message.chars().count() > 5000 {
        return Err(ApiError::new("Your message is too long. Please keep it under 5000 characters.", 400));
    }

    let source = body
        .source
        .map(|s| s.trim().to_lowercase())
        .filter(|s| !s.is_empty() && s.len() <= 50 && s.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_'))
        .unwrap_or_else(|| "contact".to_string());
    let page_url = body
        .page_url
        .map(|u| u.trim().chars().take(500).collect::<String>())
        .filter(|u| !u.is_empty() && !u.chars().any(char::is_control));

    Ok(Enquiry { name, email, phone, message, source, page_url })
}

fn email_text(e: &Enquiry, received: &str) -> String {
    let mut text = format!(
        "New enquiry from the Bright Wings website.\n\n\
         Name:    {}\n\
         E-mail:  {}\n\
         Phone:   {}\n\
         Form:    {}\n",
        e.name, e.email, e.phone, e.source
    );
    if let Some(url) = &e.page_url {
        text.push_str(&format!("Page:    {url}\n"));
    }
    text.push_str(&format!("Received: {received}\n\nMessage:\n{}\n\n-- \nReply to this e-mail to answer {} directly.\n", e.message, e.name));
    text
}

async fn create_enquiry_handler(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    body: web::Json<EnquiryDTO>,
) -> Result<ApiResponse<Value>, ApiError> {
    let enquiry = validate(body.into_inner())?;

    let ip = req.connection_info().realip_remote_addr().unwrap_or("unknown").to_string();
    base::rate_limit::LIMITER.hit(&format!("enquiry:{ip}"), MAX_PER_HOUR, Duration::from_secs(60 * 60))?;

    let id: Uuid = sqlx::query_scalar(
        "INSERT INTO enquiries (name, email, phone, message, source, page_url, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
    )
    .bind(&enquiry.name)
    .bind(&enquiry.email)
    .bind(&enquiry.phone)
    .bind(&enquiry.message)
    .bind(&enquiry.source)
    .bind(&enquiry.page_url)
    .bind(ip.chars().take(64).collect::<String>())
    .fetch_one(pool.get_ref())
    .await
    .map_err(base::error::internal)?;

    let to = std::env::var("ENQUIRY_TO_EMAIL")
        .ok()
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| DEFAULT_TO.to_string());
    let ist = FixedOffset::east_opt(5 * 3600 + 30 * 60).expect("valid IST offset");
    let received = Utc::now().with_timezone(&ist).format("%d %b %Y, %I:%M %p IST").to_string();
    let subject = format!("Website enquiry from {}", enquiry.name);
    let text = email_text(&enquiry, &received);
    let reply_to = enquiry.email.clone();

    let result = web::block(move || shared::mail::send_enquiry_email(&to, &reply_to, &subject, &text))
        .await
        .map_err(|e| e.to_string())
        .and_then(|r| r);
    let email_error = result.as_ref().err().cloned();
    if let Some(err) = &email_error {
        // Saved already, so the visitor still gets a success; staff can find it in the table.
        log::error!("enquiry {id}: e-mail not sent: {err}");
    }
    sqlx::query("UPDATE enquiries SET email_sent = $2, email_error = $3 WHERE id = $1")
        .bind(id)
        .bind(email_error.is_none())
        .bind(&email_error)
        .execute(pool.get_ref())
        .await
        .map_err(base::error::internal)?;

    Ok(ApiResponse(json!({ "id": id, "email_sent": email_error.is_none() })))
}

pub fn enquiries_routes(cfg: &mut web::ServiceConfig) {
    // A plain route, not a scope: other /public/* routes live in portal.rs, and a
    // `/public` scope here would hide them (actix scopes do not fall through).
    cfg.route("/public/enquiries", web::post().to(create_enquiry_handler));
}

#[cfg(test)]
mod tests {
    use super::*;

    fn dto(name: &str, email: &str, phone: &str, message: &str) -> EnquiryDTO {
        EnquiryDTO {
            name: name.into(),
            email: email.into(),
            phone: phone.into(),
            message: message.into(),
            source: None,
            page_url: None,
        }
    }

    #[test]
    fn accepts_a_normal_enquiry_and_tidies_it() {
        let e = validate(dto("  Asha  ", " Asha@Example.COM ", "+971 52 609 9279", " Hi ")).unwrap();
        assert_eq!(e.name, "Asha");
        assert_eq!(e.email, "asha@example.com");
        assert_eq!(e.message, "Hi");
        assert_eq!(e.source, "contact");
    }

    #[test]
    fn rejects_bad_fields() {
        assert!(validate(dto("", "a@b.co", "9876543210", "hi")).is_err());
        assert!(validate(dto("A", "not-an-email", "9876543210", "hi")).is_err());
        assert!(validate(dto("A", "a@b.co", "12345", "hi")).is_err());
        assert!(validate(dto("A", "a@b.co", "98765abc10", "hi")).is_err());
        assert!(validate(dto("A", "a@b.co", "9876543210", "   ")).is_err());
        assert!(validate(dto("A\nBcc: x@y.z", "a@b.co", "9876543210", "hi")).is_err());
    }

    #[test]
    fn email_text_includes_every_field() {
        let e = validate(dto("Asha", "asha@example.com", "9876543210", "Dubai trip")).unwrap();
        let text = email_text(&e, "1 Jan 2026");
        for part in ["Asha", "asha@example.com", "9876543210", "Dubai trip", "1 Jan 2026"] {
            assert!(text.contains(part), "missing {part}");
        }
    }
}
