use std::time::Duration;

use actix_web::{web, HttpRequest};
use chrono::{DateTime, FixedOffset, NaiveDate, Utc};
use futures_util::{stream, StreamExt};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use sqlx::{types::Json, PgConnection, PgPool};
use uuid::Uuid;

use auth::api::utils::{
    otp::is_valid_otp_format,
    phone::{is_valid_phone, normalize_phone},
};
use base::{
    constants::PASSWORD_HASH_SECRET,
    error::{internal, ApiError, ApiResponse},
    rate_limit::LIMITER,
};

const OFFICE_EMAIL: &str = "info@brightwingstravel.com";
const SITE: &str = "https://brightwingstravel.com";
const MAX_ATTEMPTS: i32 = 5;
const NOTIFICATION_ATTEMPTS: i32 = 3;
const HOUR: Duration = Duration::from_secs(3600);

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
enum Destination {
    Dubai,
    Thailand,
    Jaipur,
}

impl Destination {
    fn title(&self) -> &'static str {
        match self {
            Self::Dubai => "Dubai",
            Self::Thailand => "Thailand",
            Self::Jaipur => "Jaipur",
        }
    }
}

#[derive(Deserialize, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
enum Target {
    Destination {
        destination: Destination,
    },
    Tour {
        tour_id: Uuid,
        email: String,
        date: Option<NaiveDate>,
        travellers: String,
        whatsapp_opt_in: bool,
    },
    Service {
        service_slug: String,
        email: String,
        date: Option<NaiveDate>,
        travellers: String,
        whatsapp_opt_in: bool,
    },
}

#[derive(Deserialize, Serialize)]
struct Draft {
    name: String,
    phone: String,
    target: Target,
}

#[derive(Deserialize)]
struct Verification {
    draft: Draft,
    code: String,
}

struct Trip {
    label: String,
    url: String,
    tour_id: Option<Uuid>,
    details: String,
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

impl Draft {
    fn validate(mut self) -> Result<Self, ApiError> {
        self.name = self.name.trim().to_owned();
        if self.name.is_empty()
            || self.name.chars().count() > 100
            || self.name.chars().any(char::is_control)
        {
            return Err(ApiError::new(
                "Please enter your name (up to 100 characters)",
                400,
            ));
        }

        let phone = normalize_phone(&self.phone);
        if self.phone.len() > 30
            || !is_valid_phone(&self.phone)
            || (!phone.starts_with('+') && phone.len() != 10)
        {
            return Err(ApiError::new(
                "Enter a valid phone number with its country code",
                400,
            ));
        }
        self.phone = shared::twilio::to_e164(&phone);

        if let Target::Tour {
            email, travellers, ..
        }
        | Target::Service {
            email, travellers, ..
        } = &mut self.target
        {
            *email = email.trim().to_lowercase();
            if email.len() > 200
                || email.chars().any(char::is_control)
                || !super::plausible_email(email)
            {
                return Err(ApiError::new("Please enter a valid email address", 400));
            }
            traveller_group(travellers)?;
        }
        Ok(self)
    }

    fn trip_preferences(&self) -> (&str, String, &'static str, Option<&str>) {
        match &self.target {
            Target::Destination { .. } => ("", "Not specified".into(), "Not specified", None),
            Target::Tour {
                email,
                date,
                travellers,
                whatsapp_opt_in,
                ..
            }
            | Target::Service {
                email,
                date,
                travellers,
                whatsapp_opt_in,
                ..
            } => (
                email,
                date.map(|date| date.format("%d %b %Y").to_string())
                    .unwrap_or_else(|| "Not specified".into()),
                traveller_group(travellers).expect("validated tour draft"),
                whatsapp_opt_in.then_some(self.phone.as_str()),
            ),
        }
    }
}

async fn resolve_trip(conn: &mut PgConnection, target: &Target) -> Result<Trip, ApiError> {
    match target {
        Target::Destination { destination } => {
            let title = destination.title();
            Ok(Trip {
                label: title.into(),
                url: format!("{SITE}/{}", title.to_ascii_lowercase()),
                tour_id: None,
                details: format!("Destination: {title}"),
            })
        }
        Target::Service { service_slug, .. } => {
            let title: Option<String> = sqlx::query_scalar(
                "SELECT content->>'title' FROM website_services WHERE slug = $1 AND is_published",
            )
            .bind(service_slug)
            .fetch_optional(conn)
            .await?;
            let title =
                title.ok_or_else(|| ApiError::new("This service is no longer available", 404))?;
            Ok(Trip {
                details: format!("Service: {title}"),
                label: title,
                url: format!("{SITE}/services/{service_slug}"),
                tour_id: None,
            })
        }
        Target::Tour { tour_id, .. } => {
            let row: Option<(String, String, String, String)> = sqlx::query_as(
                "SELECT COALESCE(NULLIF(TRIM(headline), ''), title), location, package_type, duration
                 FROM tours WHERE id = $1 AND is_published AND package_type IS NOT NULL",
            )
            .bind(tour_id)
            .fetch_optional(conn)
            .await?;
            let (title, location, kind, duration) =
                row.ok_or_else(|| ApiError::new("This tour is no longer available", 404))?;
            let label = if location.trim().is_empty() {
                title.clone()
            } else {
                format!("{title} ({location})")
            };
            let kind = if kind == "holiday" {
                "Holiday package"
            } else {
                "Individual package"
            };
            let mut details = format!("Tour: {label}\nTour ID: {tour_id}\nPackage type: {kind}");
            if !duration.trim().is_empty() {
                details.push_str(&format!("\nDuration: {duration}"));
            }
            Ok(Trip {
                label,
                url: format!("{SITE}/packages/{tour_id}"),
                tour_id: Some(*tour_id),
                details,
            })
        }
    }
}

fn digest(domain: &[u8], values: &[&[u8]]) -> String {
    let mut hash = Sha256::new();
    for value in std::iter::once(domain).chain(values.iter().copied()) {
        hash.update(value);
        hash.update([0]);
    }
    hash.update(PASSWORD_HASH_SECRET.as_bytes());
    hex::encode(hash.finalize())
}

fn code_hash(id: Uuid, draft: &Draft, code: &str) -> Result<String, ApiError> {
    let draft = serde_json::to_vec(draft).map_err(internal)?;
    Ok(digest(
        b"tour-enquiry-code",
        &[id.as_bytes(), &draft, code.as_bytes()],
    ))
}

async fn lock_phone(conn: &mut PgConnection, phone_key: &str) -> Result<(), sqlx::Error> {
    sqlx::query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))")
        .bind(phone_key)
        .execute(conn)
        .await?;
    Ok(())
}

async fn request_code(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    body: web::Json<Draft>,
) -> Result<ApiResponse<Value>, ApiError> {
    let draft = body.into_inner().validate()?;
    let ip = req
        .connection_info()
        .realip_remote_addr()
        .unwrap_or("unknown")
        .to_owned();
    LIMITER.hit(&format!("tour-enquiry-otp:{ip}"), 15, HOUR)?;

    let id = Uuid::new_v4();
    let hash = code_hash(id, &draft, "")?;
    let phone_key = digest(b"tour-enquiry-phone", &[draft.phone.as_bytes()]);
    let draft_data = serde_json::to_vec(&draft).map_err(internal)?;
    let draft_key = digest(b"tour-enquiry-draft", &[&draft_data]);
    let mut tx = pool.begin().await?;
    if !matches!(draft.target, Target::Destination { .. }) {
        resolve_trip(&mut tx, &draft.target).await?;
    }
    lock_phone(&mut tx, &phone_key).await?;
    let (count, cooling_down): (i64, bool) = sqlx::query_as(
        "SELECT COUNT(*), COALESCE(MAX(created_at) > NOW() - INTERVAL '1 minute', FALSE)
         FROM tour_enquiry_challenges WHERE phone_key = $1 AND created_at > NOW() - INTERVAL '1 hour'",
    )
    .bind(&phone_key)
    .fetch_one(&mut *tx)
    .await?;
    if count >= 5 || cooling_down {
        return Err(ApiError::new(
            "Please wait before requesting another code",
            429,
        ));
    }
    sqlx::query(
        "INSERT INTO tour_enquiry_challenges (id, phone_key, code_hash, draft_key) VALUES ($1, $2, $3, $4)",
    )
    .bind(id)
    .bind(phone_key)
    .bind(hash)
    .bind(draft_key)
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;

    let sid = shared::twilio::send_enquiry_code(&draft.phone)
        .await
        .map_err(|error| {
            log::warn!("Tour enquiry verification {id}: Twilio could not send the SMS: {error}");
            ApiError::new(
                "We couldn’t send the SMS code. Check the number and try again in a minute.",
                503,
            )
        })?;
    sqlx::query(
        "UPDATE tour_enquiry_challenges SET sent = TRUE, sms_verification_sid = $2 WHERE id = $1",
    )
    .bind(id)
    .bind(sid)
    .execute(pool.get_ref())
    .await?;
    Ok(ApiResponse(
        json!({ "challenge_id": id, "resend_after": 60 }),
    ))
}

async fn verify_code(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    challenge_id: web::Path<Uuid>,
    body: web::Json<Verification>,
) -> Result<ApiResponse<Value>, ApiError> {
    let Verification { draft, code } = body.into_inner();
    let draft = draft.validate()?;
    let invalid = || {
        ApiError::new(
            "That code is incorrect or has expired. You can request a new code.",
            400,
        )
    };
    if !is_valid_otp_format(&code) {
        return Err(invalid());
    }
    let ip = req
        .connection_info()
        .realip_remote_addr()
        .unwrap_or("unknown")
        .to_owned();
    LIMITER.hit(&format!("tour-enquiry-verify:{ip}"), 75, HOUR)?;

    let mut tx = pool.begin().await?;
    let challenge: Option<(String, i32, Option<Uuid>, String, Option<String>, Option<String>)> = sqlx::query_as(
        "SELECT code_hash, attempts, enquiry_id, phone_key, draft_key, sms_verification_sid FROM tour_enquiry_challenges
         WHERE id = $1 AND sent AND expires_at > NOW() FOR UPDATE",
    )
    .bind(*challenge_id)
    .fetch_optional(&mut *tx)
    .await?;
    let (expected, attempts, existing_enquiry, phone_key, draft_key, sms_sid) =
        challenge.ok_or_else(invalid)?;
    if attempts >= MAX_ATTEMPTS {
        return Err(ApiError::new(
            "Too many incorrect attempts. Please request a new code.",
            429,
        ));
    }
    let submitted_hash = code_hash(*challenge_id, &draft, &code)?;
    let approved = if let Some(sid) = sms_sid.filter(|_| existing_enquiry.is_none()) {
        if code_hash(*challenge_id, &draft, "")? == expected {
            shared::twilio::check_enquiry_code(&sid, &code)
                .await
                .map_err(|error| {
                    log::warn!(
                        "Enquiry verification {}: SMS check failed: {error}",
                        *challenge_id
                    );
                    ApiError::new("We couldn’t check your SMS code. Please try again.", 503)
                })?
        } else {
            false
        }
    } else {
        submitted_hash == expected
    };
    if !approved {
        sqlx::query("UPDATE tour_enquiry_challenges SET attempts = attempts + 1 WHERE id = $1 AND enquiry_id IS NULL")
            .bind(*challenge_id)
            .execute(&mut *tx)
            .await?;
        tx.commit().await?;
        return Err(invalid());
    }
    if let Some(id) = existing_enquiry {
        return Ok(ApiResponse(json!({ "id": id })));
    }

    // Different codes for the same draft can still be valid after a resend.
    lock_phone(&mut tx, &phone_key).await?;
    let duplicate: Option<Uuid> = sqlx::query_scalar(
        "SELECT c.enquiry_id FROM tour_enquiry_challenges c
         JOIN enquiries e ON e.id = c.enquiry_id
         WHERE c.draft_key = $1 AND c.expires_at > NOW() AND e.created_at > NOW() - INTERVAL '10 minutes'
         ORDER BY c.expires_at DESC LIMIT 1",
    )
    .bind(draft_key)
    .fetch_optional(&mut *tx)
    .await?;
    if let Some(id) = duplicate {
        link_enquiry(&mut tx, *challenge_id, id, &submitted_hash).await?;
        tx.commit().await?;
        return Ok(ApiResponse(json!({ "id": id })));
    }

    let trip = resolve_trip(&mut tx, &draft.target).await?;
    let (email, date, travellers, greeting_to) = draft.trip_preferences();
    let (source, subject) = match &draft.target {
        Target::Tour { .. } => ("tour", "Tour enquiry"),
        Target::Destination { .. } => ("destination", "Destination enquiry"),
        Target::Service { .. } => ("website-service", "Service enquiry"),
    };
    let message = format!(
        "{}\nPage: {}\nPreferred travel date: {date}\nTravellers: {travellers}",
        trip.details, trip.url,
    );
    let notification = Notice {
        label: trip.label,
        date,
        travellers: travellers.into(),
    };
    let id: Uuid = sqlx::query_scalar(
        "INSERT INTO enquiries (name, email, phone, message, source, ip_address, subject, tour_id, whatsapp_greeting_to, page_url,
                                 tour_notification, tour_notification_due_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) RETURNING id",
    )
    .bind(&draft.name)
    .bind(email)
    .bind(&draft.phone)
    .bind(&message)
    .bind(source)
    .bind(ip.chars().take(64).collect::<String>())
    .bind(subject)
    .bind(trip.tour_id)
    .bind(greeting_to)
    .bind(&trip.url)
    .bind(Json(notification))
    .fetch_one(&mut *tx)
    .await?;
    link_enquiry(&mut tx, *challenge_id, id, &submitted_hash).await?;
    tx.commit().await?;
    Ok(ApiResponse(json!({ "id": id })))
}

async fn link_enquiry(
    conn: &mut PgConnection,
    challenge_id: Uuid,
    enquiry_id: Uuid,
    verified_hash: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE tour_enquiry_challenges SET enquiry_id = $2, code_hash = $3 WHERE id = $1")
        .bind(challenge_id)
        .bind(enquiry_id)
        .bind(verified_hash)
        .execute(conn)
        .await?;
    Ok(())
}

#[derive(Deserialize, Serialize)]
struct Notice {
    label: String,
    date: String,
    travellers: String,
}

#[derive(sqlx::FromRow)]
struct NotificationJob {
    id: Uuid,
    name: String,
    email: String,
    phone: String,
    message: String,
    subject: String,
    page_url: String,
    created_at: DateTime<Utc>,
    email_sent: bool,
    whatsapp_message_sid: Option<String>,
    tour_notification: Json<Notice>,
    tour_notification_attempts: i32,
    tour_notification_due_at: DateTime<Utc>,
}

pub fn spawn_notification_worker(pool: PgPool) {
    actix_web::rt::spawn(async move {
        let mut tick = actix_web::rt::time::interval(Duration::from_secs(10));
        loop {
            tick.tick().await;
            match claim_jobs(&pool).await {
                Ok(jobs) => {
                    stream::iter(jobs)
                        .for_each_concurrent(5, |job| deliver(&pool, job))
                        .await;
                }
                Err(error) => log::error!("Could not claim tour enquiry notifications: {error}"),
            }
        }
    });
}

async fn claim_jobs(pool: &PgPool) -> Result<Vec<NotificationJob>, sqlx::Error> {
    // The lease expires if a backend stops mid-send. Other workers skip claimed rows.
    sqlx::query_as(
        "WITH ready AS (
             SELECT id FROM enquiries
             WHERE tour_notification_due_at <= NOW() AND tour_notification_attempts < $1
             ORDER BY tour_notification_due_at LIMIT 5 FOR UPDATE SKIP LOCKED
         )
         UPDATE enquiries e
         SET tour_notification_due_at = clock_timestamp() + INTERVAL '5 minutes'
         FROM ready WHERE e.id = ready.id
         RETURNING e.id, e.name, e.email, e.phone, e.message, e.subject, e.page_url, e.created_at,
                   e.email_sent, e.whatsapp_message_sid, e.tour_notification, e.tour_notification_attempts,
                   e.tour_notification_due_at",
    )
    .bind(NOTIFICATION_ATTEMPTS)
    .fetch_all(pool)
    .await
}

async fn deliver(pool: &PgPool, job: NotificationJob) {
    let Notice {
        label,
        date,
        travellers,
    } = job.tour_notification.0;
    let received = job
        .created_at
        .with_timezone(&FixedOffset::east_opt(5 * 3600 + 30 * 60).expect("valid IST offset"))
        .format("%d %b %Y, %I:%M %p IST");
    let whatsapp_label = format!("{label} | {}", job.page_url);
    let subject = format!("Bright Wings {} - {label}", job.subject);
    let email_label = if job.email.is_empty() {
        "Not provided"
    } else {
        &job.email
    };
    let text = format!(
        "BRIGHT WINGS TRAVEL\nNew verified enquiry\n\nCUSTOMER DETAILS\nFull name: {}\nEmail: {email_label}\nVerified phone: {}\n\nTRIP DETAILS\n{}\n\nReceived: {received}\nEnquiry ID: {}\n",
        job.name, job.phone, job.message, job.id,
    );
    let email = async {
        if job.email_sent {
            return Ok(());
        }
        let reply_to = (!job.email.is_empty()).then(|| job.email.clone());
        web::block(move || {
            shared::mail::send_enquiry_email(OFFICE_EMAIL, reply_to.as_deref(), &subject, &text)
        })
        .await
        .map_err(|error| error.to_string())?
    };
    let whatsapp = async {
        if let Some(sid) = &job.whatsapp_message_sid {
            return Ok(sid.clone());
        }
        shared::twilio::send_tour_enquiry_whatsapp([
            &whatsapp_label,
            &job.name,
            email_label,
            &job.phone,
            &date,
            &travellers,
        ])
        .await
    };
    let (email, whatsapp) = futures_util::future::join(email, whatsapp).await;
    let email_error = email.err();
    let (whatsapp_sid, whatsapp_error) = match whatsapp {
        Ok(sid) => (Some(sid), None),
        Err(error) => (None, Some(error)),
    };
    if let Some(error) = &email_error {
        log::warn!("Tour enquiry {}: email delivery failed: {error}", job.id);
    }
    if let Some(error) = &whatsapp_error {
        log::warn!("Tour enquiry {}: office WhatsApp failed: {error}", job.id);
    }
    let retry = job.tour_notification_attempts + 1 < NOTIFICATION_ATTEMPTS
        && (email_error.is_some() || whatsapp_error.is_some());
    if let Err(error) = sqlx::query(
        "UPDATE enquiries SET email_sent = $2, email_error = $3, whatsapp_message_sid = $4, whatsapp_error = $5,
            whatsapp_greeting_check_at = CASE
                WHEN whatsapp_message_sid IS NULL AND $4::text IS NOT NULL AND whatsapp_greeting_to IS NOT NULL THEN NOW()
                ELSE whatsapp_greeting_check_at END,
            tour_notification_due_at = CASE WHEN $6 THEN NOW() + INTERVAL '2 minutes' END,
            tour_notification_attempts = tour_notification_attempts + 1
         WHERE id = $1 AND tour_notification_due_at = $7",
    )
    .bind(job.id)
    .bind(email_error.is_none())
    .bind(email_error)
    .bind(whatsapp_sid)
    .bind(whatsapp_error)
    .bind(retry)
    .bind(job.tour_notification_due_at)
    .execute(pool)
    .await
    {
        log::error!("Tour enquiry {}: could not store delivery results: {error}", job.id);
    }
}

pub(super) fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("/public/tour-enquiries/otp", web::post().to(request_code))
        .route(
            "/public/tour-enquiries/otp/{challenge_id}/verify",
            web::post().to(verify_code),
        );
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn service_enquiry_preserves_the_selected_slug_and_trip_preferences() {
        let draft: Draft = serde_json::from_value(json!({
            "name": "Asha", "phone": "9876543210",
            "target": { "kind": "service", "service_slug": "flights", "email": " Asha@Example.com ",
                "date": null, "travellers": "2", "whatsapp_opt_in": true }
        }))
        .unwrap();
        let draft = draft.validate().unwrap();
        assert_eq!(
            draft.trip_preferences(),
            (
                "asha@example.com",
                "Not specified".into(),
                "2 travellers",
                Some("+919876543210")
            )
        );
        assert!(
            matches!(draft.target, Target::Service { service_slug, .. } if service_slug == "flights")
        );
    }

    #[test]
    fn quick_enquiry_accepts_only_supported_destinations() {
        for (slug, title) in [
            ("dubai", "Dubai"),
            ("thailand", "Thailand"),
            ("jaipur", "Jaipur"),
        ] {
            let draft: Draft = serde_json::from_value(json!({
                "name": " Asha ",
                "phone": "98765 43210",
                "target": { "kind": "destination", "destination": slug },
            }))
            .unwrap();
            let draft = draft.validate().unwrap();
            assert_eq!(draft.name, "Asha");
            assert_eq!(draft.phone, "+919876543210");
            assert_eq!(draft.trip_preferences().3, None);
            let Target::Destination { destination } = draft.target else {
                panic!("expected a destination");
            };
            assert_eq!(destination.title(), title);
        }
        assert!(serde_json::from_value::<Target>(
            json!({ "kind": "destination", "destination": "invalid" })
        )
        .is_err());
    }

    #[test]
    fn detail_enquiry_keeps_optional_dates_and_whatsapp_confirmation() {
        let id = Uuid::new_v4();
        let draft: Draft = serde_json::from_value(json!({
            "name": "Asha",
            "phone": "+44 7700 900123",
            "target": {
                "kind": "tour", "tour_id": id, "email": " Asha@Example.COM ",
                "date": null, "travellers": "3–5", "whatsapp_opt_in": true,
            },
        }))
        .unwrap();
        let draft = draft.validate().unwrap();
        assert_eq!(
            draft.trip_preferences(),
            (
                "asha@example.com",
                "Not specified".into(),
                "3–5 travellers",
                Some("+447700900123")
            )
        );
        assert!(matches!(draft.target, Target::Tour { tour_id, .. } if tour_id == id));
        assert!(traveller_group("arbitrary").is_err());
    }
}
