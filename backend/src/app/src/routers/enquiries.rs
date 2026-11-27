//! Website contact form (brightwingstravel.in / .com).
//!
//! `POST /public/enquiries` is public (no sign-in). Each enquiry is saved in `enquiries`
//! (migrations 0036 and 0042) and then e-mailed to the office from the `ENQUIRY_SMTP_*`
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

const CONTACT_TO: &str = "info@brightwingstravel.com";
// Keep tour enquiries on the demo inbox until the owner approves the switch.
const TOUR_ENQUIRY_TO: &str = "hemant05kumawat@gmail.com";
const OTHER_ENQUIRY_DEFAULT_TO: &str = "info@brightwingstravel.in";
/// Enquiries one IP address may send per hour; stops a bot from flooding the inbox.
const MAX_PER_HOUR: u32 = 5;

#[derive(Debug, Deserialize)]
pub struct EnquiryDTO {
    pub name: String,
    pub email: String,
    pub phone: String,
    pub message: String,
    #[serde(default)]
    pub subject: Option<String>,
    /// Which form sent it (e.g. "contact"). Optional.
    #[serde(default)]
    pub source: Option<String>,
}

struct Enquiry {
    name: String,
    email: String,
    phone: String,
    message: String,
    subject: String,
    source: String,
}

#[derive(Debug, Deserialize)]
struct TourEnquiryDTO {
    name: String,
    email: String,
    phone: String,
    date: Option<chrono::NaiveDate>,
    travellers: String,
    #[serde(default)]
    whatsapp_opt_in: bool,
}

fn greeting_phone(phone: &str) -> Result<String, ApiError> {
    use auth::api::utils::phone::{is_valid_phone, normalize_phone};

    let stored = normalize_phone(phone);
    if !is_valid_phone(phone) || (!stored.starts_with('+') && stored.len() != 10) {
        return Err(ApiError::new("Enter a valid WhatsApp number with its country code", 400));
    }
    Ok(shared::twilio::to_e164(&stored))
}

fn traveller_group(value: &str) -> Result<&'static str, ApiError> {
    match value {
        "1" => Ok("1 traveller"),
        "2" => Ok("2 travellers"),
        "3–5" | "3-5" => Ok("3–5 travellers"),
        "6+" => Ok("6 or more travellers"),
        _ => Err(ApiError::new("Please select a valid group size", 400)),
    }
}

pub(crate) fn plausible_email(value: &str) -> bool {
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
    if email.len() > 200 || email.chars().any(char::is_control) || !plausible_email(&email) {
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

    let subject = body.subject.as_deref().map(str::trim).filter(|value| !value.is_empty()).unwrap_or("General Enquiry");
    if subject.chars().count() > 120 || subject.chars().any(char::is_control) {
        return Err(ApiError::new("Please enter a subject of up to 120 characters on one line", 400));
    }

    let source = body
        .source
        .map(|s| s.trim().to_lowercase())
        .filter(|s| !s.is_empty() && s.len() <= 50 && s.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_'))
        .unwrap_or_else(|| "contact".to_string());

    Ok(Enquiry { name, email, phone, message, subject: subject.to_string(), source })
}

fn email_text(e: &Enquiry, received: &str) -> String {
    let source = if e.source == "contact" { "Website contact form" } else { e.source.as_str() };
    format!(
        "BRIGHT WINGS TRAVEL\n\
         New website contact enquiry\n\n\
         CUSTOMER DETAILS\n\
         Full name            {}\n\
         Email address        {}\n\
         WhatsApp / phone     {}\n\n\
         ENQUIRY\n\
         Subject              {}\n\
         Source               {source}\n\
         Received             {received}\n\n\
         MESSAGE\n\
         {}\n\n\
         Reply to this email to answer {} directly.\n",
        e.name, e.email, e.phone, e.subject, e.message, e.name
    )
}

fn recipient(source: &str) -> String {
    if source == "contact" {
        return CONTACT_TO.to_string();
    }
    std::env::var("ENQUIRY_TO_EMAIL")
        .ok()
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
        .unwrap_or_else(|| OTHER_ENQUIRY_DEFAULT_TO.to_string())
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
        "INSERT INTO enquiries (name, email, phone, message, source, ip_address, subject)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
    )
    .bind(&enquiry.name)
    .bind(&enquiry.email)
    .bind(&enquiry.phone)
    .bind(&enquiry.message)
    .bind(&enquiry.source)
    .bind(ip.chars().take(64).collect::<String>())
    .bind(&enquiry.subject)
    .fetch_one(pool.get_ref())
    .await
    .map_err(base::error::internal)?;

    let to = recipient(&enquiry.source);
    let ist = FixedOffset::east_opt(5 * 3600 + 30 * 60).expect("valid IST offset");
    let received = Utc::now().with_timezone(&ist).format("%d %b %Y, %I:%M %p IST").to_string();
    let subject = format!("Bright Wings website enquiry - {}", enquiry.subject);
    let text = email_text(&enquiry, &received);
    let reply_to = enquiry.email.clone();

    let result = web::block(move || shared::mail::send_enquiry_email(&to, Some(reply_to.as_str()), &subject, &text))
        .await
        .map_err(|e| e.to_string())
        .and_then(|r| r);
    let email_error = result.as_ref().err().cloned();
    if let Some(err) = &email_error {
        // The frontend can distinguish a saved enquiry from a delivered email.
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

async fn create_tour_enquiry_handler(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    tour_id: web::Path<Uuid>,
    body: web::Json<TourEnquiryDTO>,
) -> Result<ApiResponse<Value>, ApiError> {
    let body = body.into_inner();
    let group = traveller_group(&body.travellers)?;
    let date = body.date.map(|date| date.format("%d %b %Y").to_string()).unwrap_or_else(|| "Not specified".into());
    let mut enquiry = validate(EnquiryDTO {
        name: body.name,
        email: body.email,
        phone: body.phone,
        message: format!("Preferred travel date: {date}\nTravellers: {group}"),
        subject: Some("Tour enquiry".into()),
        source: Some("tour".into()),
    })?;
    let greeting_to = body.whatsapp_opt_in.then(|| greeting_phone(&enquiry.phone)).transpose()?;
    let ip = req.connection_info().realip_remote_addr().unwrap_or("unknown").to_string();
    base::rate_limit::LIMITER.hit(&format!("tour-enquiry:{ip}"), MAX_PER_HOUR, Duration::from_secs(60 * 60))?;

    let tour: Option<(String, String)> = sqlx::query_as(
        "SELECT title, location FROM tours WHERE id = $1 AND is_published AND package_type IS NOT NULL",
    )
    .bind(*tour_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(base::error::internal)?;
    let (title, location) = tour.ok_or_else(|| ApiError::new("This tour is no longer available", 404))?;
    let tour = if location.trim().is_empty() { title.clone() } else { format!("{title} ({location})") };
    enquiry.message = format!("Tour: {tour}\nTour ID: {}\n{}", *tour_id, enquiry.message);

    let id: Uuid = sqlx::query_scalar(
        "INSERT INTO enquiries (name, email, phone, message, source, ip_address, subject, tour_id, whatsapp_greeting_to)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
    )
    .bind(&enquiry.name)
    .bind(&enquiry.email)
    .bind(&enquiry.phone)
    .bind(&enquiry.message)
    .bind(&enquiry.source)
    .bind(ip.chars().take(64).collect::<String>())
    .bind(&enquiry.subject)
    .bind(*tour_id)
    .bind(greeting_to)
    .fetch_one(pool.get_ref())
    .await
    .map_err(base::error::internal)?;

    let ist = FixedOffset::east_opt(5 * 3600 + 30 * 60).expect("valid IST offset");
    let received = Utc::now().with_timezone(&ist).format("%d %b %Y, %I:%M %p IST").to_string();
    let text = email_text(&enquiry, &received);
    let subject = format!("Bright Wings tour enquiry - {title}");
    let reply_to = enquiry.email.clone();
    let email = web::block(move || shared::mail::send_enquiry_email(TOUR_ENQUIRY_TO, Some(&reply_to), &subject, &text));
    let whatsapp = shared::twilio::send_tour_enquiry_whatsapp([
        &tour, &enquiry.name, &enquiry.email, &enquiry.phone, &date, group,
    ]);
    let (email, whatsapp) = futures_util::future::join(email, whatsapp).await;
    let email_error = email.map_err(|e| e.to_string()).and_then(|result| result).err();
    let (whatsapp_message_sid, whatsapp_error) = match whatsapp {
        Ok(sid) => (Some(sid), None),
        Err(error) => (None, Some(error)),
    };
    let email_sent = email_error.is_none();
    let whatsapp_queued = whatsapp_message_sid.is_some();
    if !email_sent || !whatsapp_queued {
        log::warn!("tour enquiry {id}: email accepted={email_sent}, WhatsApp accepted={whatsapp_queued}");
    }
    // Do not tell the visitor to resubmit an already-saved enquiry if only the delivery metadata write fails.
    if let Err(error) = sqlx::query(
        "UPDATE enquiries SET email_sent = $2, email_error = $3, whatsapp_message_sid = $4, whatsapp_error = $5,
            whatsapp_greeting_check_at = CASE WHEN $4 IS NOT NULL AND whatsapp_greeting_to IS NOT NULL THEN NOW() END
         WHERE id = $1",
    )
    .bind(id)
    .bind(email_sent)
    .bind(email_error)
    .bind(whatsapp_message_sid)
    .bind(whatsapp_error)
    .execute(pool.get_ref())
    .await
    {
        log::error!("tour enquiry {id}: could not store notification outcomes: {error}");
    }

    Ok(ApiResponse(json!({ "id": id, "email_sent": email_sent, "whatsapp_queued": whatsapp_queued })))
}

pub fn enquiries_routes(cfg: &mut web::ServiceConfig) {
    // A plain route, not a scope: other /public/* routes live in portal.rs, and a
    // `/public` scope here would hide them (actix scopes do not fall through).
    cfg.route("/public/enquiries", web::post().to(create_enquiry_handler))
        .route("/public/tours/id/{tour_id}/enquiries", web::post().to(create_tour_enquiry_handler));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn validates_tour_group_sizes() {
        assert_eq!(traveller_group("3–5").unwrap(), "3–5 travellers");
        assert_eq!(traveller_group("6+").unwrap(), "6 or more travellers");
        assert!(traveller_group("arbitrary").is_err());
    }

    #[test]
    fn greeting_number_uses_country_code() {
        assert_eq!(greeting_phone("98765 43210").unwrap(), "+919876543210");
        assert_eq!(greeting_phone("+44 7700 900123").unwrap(), "+447700900123");
        assert!(greeting_phone("7700900").is_err());
    }

    fn dto(name: &str, email: &str, phone: &str, message: &str) -> EnquiryDTO {
        EnquiryDTO {
            name: name.into(),
            email: email.into(),
            phone: phone.into(),
            message: message.into(),
            subject: None,
            source: None,
        }
    }

    #[test]
    fn accepts_a_normal_enquiry_and_tidies_it() {
        let e = validate(dto("  Asha  ", " Asha@Example.COM ", "+971 52 609 9279", " Hi ")).unwrap();
        assert_eq!(e.name, "Asha");
        assert_eq!(e.email, "asha@example.com");
        assert_eq!(e.message, "Hi");
        assert_eq!(e.source, "contact");
        assert_eq!(e.subject, "General Enquiry");
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
    fn email_text_uses_the_approved_sections_and_contact_recipient() {
        let mut body = dto("Asha", "asha@example.com", "9876543210", "Dubai trip\nPlease share dates.");
        body.subject = Some(" Dubai Holiday ".into());
        let e = validate(body).unwrap();
        let text = email_text(&e, "1 Jan 2026");
        for part in [
            "CUSTOMER DETAILS\nFull name            Asha",
            "Email address        asha@example.com",
            "WhatsApp / phone     9876543210",
            "ENQUIRY\nSubject              Dubai Holiday",
            "Source               Website contact form",
            "Received             1 Jan 2026",
            "MESSAGE\nDubai trip\nPlease share dates.",
        ] {
            assert!(text.contains(part), "missing {part}");
        }
        assert_eq!(recipient(&e.source), "info@brightwingstravel.com");
    }

    #[test]
    fn rejects_invalid_subjects() {
        for subject in ["Dubai\nBcc: x@y.z".to_string(), "x".repeat(121)] {
            let mut body = dto("Asha", "asha@example.com", "9876543210", "Dubai trip");
            body.subject = Some(subject);
            assert!(validate(body).is_err());
        }
    }
}
