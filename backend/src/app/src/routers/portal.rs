//! Customer-portal features that sit on top of the core modules: PIN recovery,
//! member preferences, structured quotations and the booking activity feed.
//!
//! These handlers talk to Postgres directly (like `support.rs`) instead of
//! going through a module service, because they span users, bookings and the
//! CRM tables.

use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
    HttpRequest,
};
use chrono::{DateTime, Duration, Utc};
use rand::Rng;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use sqlx::PgPool;
use uuid::Uuid;

use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use auth::api::utils::phone::normalize_phone;
use auth::api::utils::pin::{hash_pin, is_valid_pin_format};
use base::{
    constants::{PASSWORD_HASH_SECRET, REFRESH_TOKEN_COOKIE_NAME},
    error::{ApiError, ApiResponse},
    jwt_claims::JwtClaims,
    role::{ADMIN, EMPLOYEE, STAFF},
};

const OTP_TTL_MINUTES: i64 = 10;
const RESET_TOKEN_TTL_MINUTES: i64 = 15;
const OTP_MAX_ATTEMPTS: i32 = 5;
const OTP_RESEND_SECONDS: i64 = 60;

fn db_err(e: sqlx::Error) -> ApiError {
    ApiError::new(e.to_string(), 500)
}

fn sha256_hex(parts: &[&str]) -> String {
    let mut hasher = Sha256::new();
    for part in parts {
        hasher.update(part.as_bytes());
        hasher.update([0u8]);
    }
    hasher.update(PASSWORD_HASH_SECRET.as_bytes());
    hex::encode(hasher.finalize())
}

// ---------------------------------------------------------------------------
// PIN recovery (public)
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct PinResetRequestDTO {
    pub phone: String,
}

#[derive(Debug, Deserialize)]
pub struct PinResetVerifyDTO {
    pub phone: String,
    pub code: String,
}

#[derive(Debug, Deserialize)]
pub struct PinResetConfirmDTO {
    pub phone: String,
    pub reset_token: String,
    pub new_pin: String,
}

async fn find_user_by_phone(
    pool: &PgPool,
    phone: &str,
) -> Result<Option<(Uuid, Option<String>, bool)>, ApiError> {
    sqlx::query_as::<_, (Uuid, Option<String>, bool)>(
        "SELECT id, email, is_active FROM users WHERE phone = $1",
    )
    .bind(normalize_phone(phone))
    .fetch_optional(pool)
    .await
    .map_err(db_err)
}

/// Sends the code by SMS gateway, falling back to e-mail, falling back to the
/// server log (so a misconfigured environment is visible, not silent).
async fn deliver_otp(phone: &str, email: Option<&str>, code: &str) {
    let message = format!(
        "{code} is your Bright Wings verification code. It expires in {OTP_TTL_MINUTES} minutes. Never share it with anyone."
    );
    if shared::sms::sms_configured() {
        match shared::sms::send_sms(phone, &message).await {
            Ok(()) => return,
            Err(err) => log::error!("PIN reset SMS failed for {phone}: {err}"),
        }
    }
    if let Some(email) = email {
        let to = email.to_string();
        let body = message.clone();
        let sent = web::block(move || {
            shared::mail::send_plain_email(&to, "Your Bright Wings verification code", &body)
        })
        .await;
        match sent {
            Ok(Ok(())) => return,
            Ok(Err(err)) => log::error!("PIN reset e-mail failed: {err}"),
            Err(err) => log::error!("PIN reset e-mail task failed: {err}"),
        }
    }
    log::warn!("PIN reset code for {phone} could not be delivered (configure SMS_WEBHOOK_URL or SMTP_*)");
}

/// Always answers the same way so the endpoint cannot be used to discover
/// which phone numbers have accounts.
async fn pin_reset_request_handler(
    pool: web::Data<PgPool>,
    body: web::Json<PinResetRequestDTO>,
) -> Result<ApiResponse<Value>, ApiError> {
    let phone = normalize_phone(&body.phone);
    let mut response = json!({ "sent": true, "expires_in_seconds": OTP_TTL_MINUTES * 60 });

    let Some((user_id, email, is_active)) = find_user_by_phone(&pool, &phone).await? else {
        return Ok(ApiResponse(response));
    };
    if !is_active {
        return Ok(ApiResponse(response));
    }

    let recent: Option<DateTime<Utc>> = sqlx::query_scalar(
        "SELECT created_at FROM pin_reset_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
    )
    .bind(user_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(db_err)?;
    if recent.is_some_and(|at| Utc::now() - at < Duration::seconds(OTP_RESEND_SECONDS)) {
        return Err(ApiError::new("Please wait a minute before requesting another code", 429));
    }

    let code = format!("{:06}", rand::thread_rng().gen_range(0..1_000_000));
    sqlx::query(
        "INSERT INTO pin_reset_requests (user_id, code_hash, expires_at) VALUES ($1, $2, $3)",
    )
    .bind(user_id)
    .bind(sha256_hex(&[&code, &user_id.to_string()]))
    .bind(Utc::now() + Duration::minutes(OTP_TTL_MINUTES))
    .execute(pool.get_ref())
    .await
    .map_err(db_err)?;

    deliver_otp(&phone, email.as_deref(), &code).await;

    // Local development only; never enable in production.
    if std::env::var("OTP_DEV_ECHO").map(|v| v == "true").unwrap_or(false) {
        response["dev_code"] = json!(code);
    }
    Ok(ApiResponse(response))
}

async fn pin_reset_verify_handler(
    pool: web::Data<PgPool>,
    body: web::Json<PinResetVerifyDTO>,
) -> Result<ApiResponse<Value>, ApiError> {
    let invalid = || ApiError::new("That code is incorrect or has expired", 400);
    let Some((user_id, _, is_active)) = find_user_by_phone(&pool, &body.phone).await? else {
        return Err(invalid());
    };
    if !is_active {
        return Err(invalid());
    }

    let request: Option<(Uuid, String, i32)> = sqlx::query_as(
        r#"SELECT id, code_hash, attempts FROM pin_reset_requests
           WHERE user_id = $1 AND consumed_at IS NULL AND verified_at IS NULL AND expires_at > NOW()
           ORDER BY created_at DESC LIMIT 1"#,
    )
    .bind(user_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(db_err)?;
    let Some((request_id, code_hash, attempts)) = request else {
        return Err(invalid());
    };
    if attempts >= OTP_MAX_ATTEMPTS {
        return Err(ApiError::new("Too many attempts. Please request a new code", 429));
    }

    sqlx::query("UPDATE pin_reset_requests SET attempts = attempts + 1 WHERE id = $1")
        .bind(request_id)
        .execute(pool.get_ref())
        .await
        .map_err(db_err)?;

    if sha256_hex(&[body.code.trim(), &user_id.to_string()]) != code_hash {
        return Err(invalid());
    }

    let token = Uuid::new_v4().simple().to_string() + &Uuid::new_v4().simple().to_string();
    sqlx::query(
        r#"UPDATE pin_reset_requests
           SET verified_at = NOW(), reset_token_hash = $2, reset_token_expires_at = $3
           WHERE id = $1"#,
    )
    .bind(request_id)
    .bind(sha256_hex(&[&token, &user_id.to_string()]))
    .bind(Utc::now() + Duration::minutes(RESET_TOKEN_TTL_MINUTES))
    .execute(pool.get_ref())
    .await
    .map_err(db_err)?;

    Ok(ApiResponse(json!({ "reset_token": token })))
}

async fn pin_reset_confirm_handler(
    pool: web::Data<PgPool>,
    body: web::Json<PinResetConfirmDTO>,
) -> Result<ApiResponse<Value>, ApiError> {
    if !is_valid_pin_format(&body.new_pin) {
        return Err(ApiError::new("PIN must be exactly 4 digits", 400));
    }
    let invalid = || ApiError::new("This reset link has expired. Please start again", 400);
    let Some((user_id, _, is_active)) = find_user_by_phone(&pool, &body.phone).await? else {
        return Err(invalid());
    };
    if !is_active {
        return Err(invalid());
    }

    let mut tx = pool.begin().await.map_err(db_err)?;
    let request_id: Option<Uuid> = sqlx::query_scalar(
        r#"SELECT id FROM pin_reset_requests
           WHERE user_id = $1 AND reset_token_hash = $2 AND consumed_at IS NULL
                 AND reset_token_expires_at > NOW()
           FOR UPDATE"#,
    )
    .bind(user_id)
    .bind(sha256_hex(&[&body.reset_token, &user_id.to_string()]))
    .fetch_optional(&mut *tx)
    .await
    .map_err(db_err)?;
    let Some(request_id) = request_id else {
        return Err(invalid());
    };

    sqlx::query("UPDATE users SET pin_hash = $2 WHERE id = $1")
        .bind(user_id)
        .bind(hash_pin(&body.new_pin))
        .execute(&mut *tx)
        .await
        .map_err(db_err)?;
    sqlx::query("UPDATE pin_reset_requests SET consumed_at = NOW() WHERE user_id = $1 AND consumed_at IS NULL")
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .map_err(db_err)?;
    // A recovered account must not stay signed in on a device the owner lost.
    sqlx::query("UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1")
        .bind(user_id)
        .execute(&mut *tx)
        .await
        .map_err(db_err)?;
    tx.commit().await.map_err(db_err)?;
    let _ = request_id;

    Ok(ApiResponse(json!({ "reset": true })))
}

// ---------------------------------------------------------------------------
// Member preferences
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct PreferencesDTO {
    pub departure_city: Option<String>,
    pub travel_style: Option<String>,
    pub travelling_with: Option<String>,
    pub trip_updates: bool,
    pub wings_activity: bool,
    pub reward_status: bool,
    pub travel_offers: bool,
    pub partner_offers: bool,
    pub channel_sms: bool,
    pub channel_in_app: bool,
}

#[derive(Debug, Deserialize)]
pub struct UpdatePreferencesDTO {
    #[serde(default)]
    pub departure_city: Option<String>,
    #[serde(default)]
    pub travel_style: Option<String>,
    #[serde(default)]
    pub travelling_with: Option<String>,
    #[serde(default)]
    pub wings_activity: Option<bool>,
    #[serde(default)]
    pub reward_status: Option<bool>,
    #[serde(default)]
    pub travel_offers: Option<bool>,
    #[serde(default)]
    pub partner_offers: Option<bool>,
    #[serde(default)]
    pub trip_updates: Option<bool>,
    #[serde(default)]
    pub channel_sms: Option<bool>,
    #[serde(default)]
    pub channel_in_app: Option<bool>,
}

const PREF_COLUMNS: &str = "departure_city, travel_style, travelling_with, trip_updates, \
     wings_activity, reward_status, travel_offers, partner_offers, channel_sms, channel_in_app";

async fn get_preferences_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
) -> Result<ApiResponse<PreferencesDTO>, ApiError> {
    let row = sqlx::query_as::<_, PreferencesDTO>(&format!(
        "SELECT {PREF_COLUMNS} FROM user_preferences WHERE user_id = $1"
    ))
    .bind(claims.sub)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(row.unwrap_or(PreferencesDTO {
        departure_city: None,
        travel_style: None,
        travelling_with: None,
        trip_updates: true,
        wings_activity: true,
        reward_status: true,
        travel_offers: false,
        partner_offers: false,
        channel_sms: true,
        channel_in_app: true,
    })))
}

async fn update_preferences_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    body: web::Json<UpdatePreferencesDTO>,
) -> Result<ApiResponse<PreferencesDTO>, ApiError> {
    let b = body.into_inner();
    let text = |value: Option<String>| value.map(|v| v.trim().to_string()).filter(|v| !v.is_empty());
    let row = sqlx::query_as::<_, PreferencesDTO>(&format!(
        r#"INSERT INTO user_preferences
               (user_id, departure_city, travel_style, travelling_with, trip_updates,
                wings_activity, reward_status, travel_offers, channel_sms, channel_in_app, partner_offers)
           VALUES ($1, $2, $3, $4, COALESCE($5, TRUE), COALESCE($6, TRUE), COALESCE($7, TRUE),
                   COALESCE($8, FALSE), COALESCE($9, TRUE), COALESCE($10, TRUE), COALESCE($11, FALSE))
           ON CONFLICT (user_id) DO UPDATE SET
               departure_city = COALESCE($2, user_preferences.departure_city),
               travel_style = COALESCE($3, user_preferences.travel_style),
               travelling_with = COALESCE($4, user_preferences.travelling_with),
               trip_updates = COALESCE($5, user_preferences.trip_updates),
               wings_activity = COALESCE($6, user_preferences.wings_activity),
               reward_status = COALESCE($7, user_preferences.reward_status),
               travel_offers = COALESCE($8, user_preferences.travel_offers),
               channel_sms = COALESCE($9, user_preferences.channel_sms),
               channel_in_app = COALESCE($10, user_preferences.channel_in_app),
               partner_offers = COALESCE($11, user_preferences.partner_offers),
               updated_at = NOW()
           RETURNING {PREF_COLUMNS}"#
    ))
    .bind(claims.sub)
    .bind(text(b.departure_city))
    .bind(text(b.travel_style))
    .bind(text(b.travelling_with))
    .bind(b.trip_updates)
    .bind(b.wings_activity)
    .bind(b.reward_status)
    .bind(b.travel_offers)
    .bind(b.channel_sms)
    .bind(b.channel_in_app)
    .bind(b.partner_offers)
    .fetch_one(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(row))
}

// ---------------------------------------------------------------------------
// Booking detail extras: advisor, quotation, activity feed
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct QuoteDTO {
    pub id: Uuid,
    pub booking_id: Uuid,
    pub base_fare: f64,
    pub taxes: f64,
    pub total: f64,
    pub currency: String,
    pub valid_until: Option<DateTime<Utc>>,
    pub inclusions: Value,
    pub exclusions: Value,
    pub summary: Value,
    pub status: String,
    pub change_note: Option<String>,
    /// Staff-only; always NULL in customer responses.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub private_note: Option<String>,
    pub created_at: DateTime<Utc>,
    pub responded_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct BookingEventDTO {
    pub id: Uuid,
    pub kind: String,
    pub message: String,
    pub actor_name: Option<String>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct AdvisorDTO {
    pub id: Uuid,
    pub name: String,
    pub title: String,
    pub phone: Option<String>,
    pub email: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PortalBookingDTO {
    pub advisor: Option<AdvisorDTO>,
    pub quote: Option<QuoteDTO>,
    pub events: Vec<BookingEventDTO>,
    /// Company support line shown on the booking screen (SUPPORT_PHONE env).
    pub support_phone: Option<String>,
}

const QUOTE_COLUMNS_STAFF: &str = "id, booking_id, base_fare::float8 AS base_fare, taxes::float8 AS taxes, \
     total::float8 AS total, currency, valid_until, inclusions, exclusions, summary, status, \
     change_note, private_note, created_at, responded_at";
const QUOTE_COLUMNS_CUSTOMER: &str = "id, booking_id, base_fare::float8 AS base_fare, taxes::float8 AS taxes, \
     total::float8 AS total, currency, valid_until, inclusions, exclusions, summary, status, \
     change_note, NULL::text AS private_note, created_at, responded_at";

async fn owned_booking(
    pool: &PgPool,
    booking_id: Uuid,
    user_id: Uuid,
) -> Result<Option<Uuid>, ApiError> {
    let row: Option<(Uuid, Option<Uuid>)> = sqlx::query_as(
        "SELECT user_id, assigned_employee_id FROM bookings WHERE id = $1",
    )
    .bind(booking_id)
    .fetch_optional(pool)
    .await
    .map_err(db_err)?;
    match row {
        Some((owner, assigned)) if owner == user_id => Ok(assigned),
        _ => Err(ApiError::new("Booking not found", 404)),
    }
}

async fn portal_booking_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<PortalBookingDTO>, ApiError> {
    let booking_id = path.into_inner();
    let assigned = owned_booking(&pool, booking_id, claims.sub).await?;

    let advisor = match assigned {
        Some(employee_id) => sqlx::query_as::<_, AdvisorDTO>(
            r#"SELECT id, TRIM(first_name || ' ' || COALESCE(last_name, '')) AS name,
                      'Travel advisor' AS title, phone, email
               FROM users WHERE id = $1"#,
        )
        .bind(employee_id)
        .fetch_optional(pool.get_ref())
        .await
        .map_err(db_err)?,
        None => None,
    };

    let quote = sqlx::query_as::<_, QuoteDTO>(&format!(
        "SELECT {QUOTE_COLUMNS_CUSTOMER} FROM booking_quotes
         WHERE booking_id = $1 AND status IN ('sent', 'accepted', 'change_requested')
         ORDER BY created_at DESC LIMIT 1"
    ))
    .bind(booking_id)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(db_err)?;

    // Customers see lifecycle events, not internal staff chatter.
    let events = sqlx::query_as::<_, BookingEventDTO>(
        r#"SELECT e.id, e.kind, e.message, NULL::text AS actor_name, e.created_at
           FROM booking_events e WHERE e.booking_id = $1 ORDER BY e.created_at"#,
    )
    .bind(booking_id)
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;

    Ok(ApiResponse(PortalBookingDTO {
        advisor,
        quote,
        events,
        support_phone: std::env::var("SUPPORT_PHONE").ok().filter(|v| !v.trim().is_empty()),
    }))
}

#[derive(Debug, Deserialize)]
pub struct QuoteChangeDTO {
    pub note: String,
}

async fn latest_open_quote(
    tx: &mut sqlx::Transaction<'_, sqlx::Postgres>,
    booking_id: Uuid,
) -> Result<(Uuid, f64), ApiError> {
    sqlx::query_as::<_, (Uuid, f64)>(
        r#"SELECT id, total::float8 FROM booking_quotes
           WHERE booking_id = $1 AND status = 'sent'
           ORDER BY created_at DESC LIMIT 1 FOR UPDATE"#,
    )
    .bind(booking_id)
    .fetch_optional(&mut **tx)
    .await
    .map_err(db_err)?
    .ok_or_else(|| ApiError::new("There is no quotation awaiting your response", 400))
}

async fn accept_quote_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<Value>, ApiError> {
    let booking_id = path.into_inner();
    owned_booking(&pool, booking_id, claims.sub).await?;
    let mut tx = pool.begin().await.map_err(db_err)?;
    let (quote_id, total) = latest_open_quote(&mut tx, booking_id).await?;

    let expired: bool = sqlx::query_scalar(
        "SELECT COALESCE(valid_until < NOW(), FALSE) FROM booking_quotes WHERE id = $1",
    )
    .bind(quote_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(db_err)?;
    if expired {
        return Err(ApiError::new("This quotation has expired. Please ask your advisor for a fresh one", 400));
    }

    sqlx::query("UPDATE booking_quotes SET status = 'accepted', responded_at = NOW() WHERE id = $1")
        .bind(quote_id)
        .execute(&mut *tx)
        .await
        .map_err(db_err)?;
    sqlx::query(
        r#"UPDATE bookings SET status = 'booking_confirmed', final_cost = $2::float8
           WHERE id = $1 AND status NOT IN ('completed', 'cancelled')"#,
    )
    .bind(booking_id)
    .bind(total)
    .execute(&mut *tx)
    .await
    .map_err(db_err)?;
    sqlx::query(
        "INSERT INTO booking_events (booking_id, actor_id, kind, message) VALUES ($1, $2, 'quote', 'Customer accepted the quotation')",
    )
    .bind(booking_id)
    .bind(claims.sub)
    .execute(&mut *tx)
    .await
    .map_err(db_err)?;
    tx.commit().await.map_err(db_err)?;
    Ok(ApiResponse(json!({ "accepted": true })))
}

async fn request_quote_change_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
    body: web::Json<QuoteChangeDTO>,
) -> Result<ApiResponse<Value>, ApiError> {
    let booking_id = path.into_inner();
    let note = body.note.trim().to_string();
    if note.is_empty() || note.chars().count() > 1000 {
        return Err(ApiError::new("Tell us what you would like changed (up to 1000 characters)", 400));
    }
    let assigned = owned_booking(&pool, booking_id, claims.sub).await?;
    let mut tx = pool.begin().await.map_err(db_err)?;
    let (quote_id, _) = latest_open_quote(&mut tx, booking_id).await?;

    sqlx::query(
        "UPDATE booking_quotes SET status = 'change_requested', change_note = $2, responded_at = NOW() WHERE id = $1",
    )
    .bind(quote_id)
    .bind(&note)
    .execute(&mut *tx)
    .await
    .map_err(db_err)?;
    sqlx::query(
        "INSERT INTO booking_events (booking_id, actor_id, kind, message) VALUES ($1, $2, 'quote', 'Customer requested a change to the quotation')",
    )
    .bind(booking_id)
    .bind(claims.sub)
    .execute(&mut *tx)
    .await
    .map_err(db_err)?;
    if let Some(employee_id) = assigned {
        sqlx::query(
            r#"INSERT INTO tasks (booking_id, assigned_to, title, description, due_at, created_by)
               VALUES ($1, $2, 'Customer requested a quote change', $3, NOW() + INTERVAL '1 day', $4)"#,
        )
        .bind(booking_id)
        .bind(employee_id)
        .bind(&note)
        .bind(claims.sub)
        .execute(&mut *tx)
        .await
        .map_err(db_err)?;
    }
    tx.commit().await.map_err(db_err)?;
    Ok(ApiResponse(json!({ "requested": true })))
}

// ---- staff side -------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct CreateQuoteDTO {
    pub base_fare: f64,
    #[serde(default)]
    pub taxes: Option<f64>,
    #[serde(default)]
    pub valid_until: Option<DateTime<Utc>>,
    #[serde(default)]
    pub inclusions: Option<Vec<String>>,
    #[serde(default)]
    pub exclusions: Option<Vec<String>>,
    #[serde(default)]
    pub summary: Option<Value>,
    #[serde(default)]
    pub private_note: Option<String>,
}

/// Admins may work any booking; employees only the ones assigned to them.
async fn ensure_staff_access(
    pool: &PgPool,
    claims: &JwtClaims,
    booking_id: Uuid,
) -> Result<(), ApiError> {
    let assigned: Option<(Option<Uuid>,)> =
        sqlx::query_as("SELECT assigned_employee_id FROM bookings WHERE id = $1")
            .bind(booking_id)
            .fetch_optional(pool)
            .await
            .map_err(db_err)?;
    let Some((assigned,)) = assigned else {
        return Err(ApiError::new("Booking not found", 404));
    };
    if claims.role == ADMIN || (claims.role == EMPLOYEE && assigned == Some(claims.sub)) {
        Ok(())
    } else {
        Err(ApiError::new("This booking is not assigned to you", 403))
    }
}

async fn staff_create_quote_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
    body: web::Json<CreateQuoteDTO>,
) -> Result<ApiResponse<QuoteDTO>, ApiError> {
    let booking_id = path.into_inner();
    ensure_staff_access(&pool, &claims, booking_id).await?;
    let b = body.into_inner();
    let taxes = b.taxes.unwrap_or(0.0);
    if !(b.base_fare.is_finite() && taxes.is_finite()) || b.base_fare < 0.0 || taxes < 0.0 {
        return Err(ApiError::new("Fare and taxes must be positive amounts", 400));
    }
    if b.base_fare + taxes <= 0.0 {
        return Err(ApiError::new("The total package amount must be greater than zero", 400));
    }
    let clean = |items: Option<Vec<String>>| -> Value {
        json!(items
            .unwrap_or_default()
            .into_iter()
            .map(|item| item.trim().to_string())
            .filter(|item| !item.is_empty())
            .collect::<Vec<_>>())
    };

    let mut tx = pool.begin().await.map_err(db_err)?;
    sqlx::query(
        "UPDATE booking_quotes SET status = 'superseded' WHERE booking_id = $1 AND status IN ('sent', 'change_requested')",
    )
    .bind(booking_id)
    .execute(&mut *tx)
    .await
    .map_err(db_err)?;
    let quote = sqlx::query_as::<_, QuoteDTO>(&format!(
        r#"INSERT INTO booking_quotes
               (booking_id, base_fare, taxes, total, valid_until, inclusions, exclusions, summary,
                private_note, status, created_by)
           VALUES ($1, $2::float8, $3::float8, ($2::float8 + $3::float8), $4, $5, $6, $7, $8, 'sent', $9)
           RETURNING {QUOTE_COLUMNS_STAFF}"#
    ))
    .bind(booking_id)
    .bind(b.base_fare)
    .bind(taxes)
    .bind(b.valid_until)
    .bind(clean(b.inclusions))
    .bind(clean(b.exclusions))
    .bind(b.summary.unwrap_or_else(|| json!({})))
    .bind(b.private_note.map(|n| n.trim().to_string()).filter(|n| !n.is_empty()))
    .bind(claims.sub)
    .fetch_one(&mut *tx)
    .await
    .map_err(db_err)?;
    sqlx::query(
        r#"UPDATE bookings SET status = 'awaiting_approval'
           WHERE id = $1 AND status IN ('new', 'assigned', 'contacted', 'awaiting_approval')"#,
    )
    .bind(booking_id)
    .execute(&mut *tx)
    .await
    .map_err(db_err)?;
    sqlx::query(
        "INSERT INTO booking_events (booking_id, actor_id, kind, message) VALUES ($1, $2, 'quote', 'Quotation sent to the customer')",
    )
    .bind(booking_id)
    .bind(claims.sub)
    .execute(&mut *tx)
    .await
    .map_err(db_err)?;
    tx.commit().await.map_err(db_err)?;
    Ok(ApiResponse(quote))
}

async fn staff_list_quotes_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<Vec<QuoteDTO>>, ApiError> {
    let booking_id = path.into_inner();
    ensure_staff_access(&pool, &claims, booking_id).await?;
    let rows = sqlx::query_as::<_, QuoteDTO>(&format!(
        "SELECT {QUOTE_COLUMNS_STAFF} FROM booking_quotes WHERE booking_id = $1 ORDER BY created_at DESC"
    ))
    .bind(booking_id)
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(rows))
}

async fn staff_events_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<Vec<BookingEventDTO>>, ApiError> {
    let booking_id = path.into_inner();
    ensure_staff_access(&pool, &claims, booking_id).await?;
    let rows = sqlx::query_as::<_, BookingEventDTO>(
        r#"SELECT e.id, e.kind, e.message,
                  TRIM(u.first_name || ' ' || COALESCE(u.last_name, '')) AS actor_name,
                  e.created_at
           FROM booking_events e LEFT JOIN users u ON u.id = e.actor_id
           WHERE e.booking_id = $1 ORDER BY e.created_at"#,
    )
    .bind(booking_id)
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(rows))
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

/// "Sign out other sessions": revokes every refresh-token family of the member
/// except the one belonging to this browser. Access tokens already issued to
/// the other devices still expire on their own within minutes.
async fn revoke_other_sessions_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    req: HttpRequest,
) -> Result<ApiResponse<Value>, ApiError> {
    let raw = req
        .cookie(&REFRESH_TOKEN_COOKIE_NAME)
        .map(|cookie| cookie.value().to_string())
        .ok_or_else(|| ApiError::new("This session cannot be identified. Please sign in again", 400))?;
    let current_hash = hex::encode(Sha256::digest(raw.as_bytes()));
    let family: Option<Uuid> = sqlx::query_scalar(
        "SELECT family_id FROM refresh_tokens WHERE user_id = $1 AND token_hash = $2 AND is_revoked = FALSE",
    )
    .bind(claims.sub)
    .bind(current_hash)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(db_err)?;
    let Some(family) = family else {
        return Err(ApiError::new("This session cannot be identified. Please sign in again", 400));
    };
    let revoked = sqlx::query(
        "UPDATE refresh_tokens SET is_revoked = TRUE WHERE user_id = $1 AND family_id <> $2 AND is_revoked = FALSE",
    )
    .bind(claims.sub)
    .bind(family)
    .execute(pool.get_ref())
    .await
    .map_err(db_err)?
    .rows_affected();
    Ok(ApiResponse(json!({ "revoked": revoked })))
}

// ---------------------------------------------------------------------------
// Staff: follow-up tasks and customer directory
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct StaffTaskDTO {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub due_at: Option<DateTime<Utc>>,
    pub status: String,
    pub priority: String,
    pub completed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub assigned_to: Uuid,
    pub assignee_name: String,
    pub booking_id: Option<Uuid>,
    pub booking_code: Option<String>,
    pub booking_type: Option<String>,
    pub booking_place: Option<String>,
    pub customer_id: Option<Uuid>,
    pub customer_name: Option<String>,
    pub customer_code: Option<String>,
    pub customer_phone: Option<String>,
    pub customer_tier: Option<String>,
}

const TASK_SELECT: &str = r#"
    SELECT t.id, t.title, t.description, t.due_at, t.status, t.priority, t.completed_at, t.created_at,
           t.assigned_to, TRIM(a.first_name || ' ' || COALESCE(a.last_name, '')) AS assignee_name,
           t.booking_id, b.display_code AS booking_code, b.type AS booking_type,
           COALESCE(b.details->>'destination', CASE WHEN b.details ? 'from' THEN (b.details->>'from') || ' → ' || (b.details->>'to') END,
                    b.details->>'country', b.details->>'region', b.details->>'destinations') AS booking_place,
           c.id AS customer_id, TRIM(c.first_name || ' ' || COALESCE(c.last_name, '')) AS customer_name,
           c.membership_code AS customer_code, c.phone AS customer_phone, c.membership_tier AS customer_tier
    FROM tasks t
    JOIN users a ON a.id = t.assigned_to
    LEFT JOIN bookings b ON b.id = t.booking_id
    LEFT JOIN users c ON c.id = COALESCE(t.customer_id, b.user_id)
"#;

#[derive(Debug, Deserialize)]
pub struct StaffTaskQuery {
    /// "me" (default) or "all" (admins only).
    #[serde(default)]
    pub scope: Option<String>,
}

async fn staff_tasks_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    query: web::Query<StaffTaskQuery>,
) -> Result<ApiResponse<Vec<StaffTaskDTO>>, ApiError> {
    let all = claims.role == ADMIN && query.scope.as_deref() == Some("all");
    let rows = sqlx::query_as::<_, StaffTaskDTO>(&format!(
        "{TASK_SELECT} WHERE ($2 OR t.assigned_to = $1) ORDER BY (t.status IN ('done', 'cancelled')), t.due_at ASC NULLS LAST, t.created_at DESC LIMIT 500"
    ))
    .bind(claims.sub)
    .bind(all)
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(rows))
}

#[derive(Debug, Deserialize)]
pub struct CreateStaffTaskDTO {
    pub title: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub due_at: Option<DateTime<Utc>>,
    #[serde(default)]
    pub priority: Option<String>,
    #[serde(default)]
    pub booking_id: Option<Uuid>,
    #[serde(default)]
    pub customer_id: Option<Uuid>,
    /// Admins may assign to a colleague; employees always own what they create.
    #[serde(default)]
    pub assigned_to: Option<Uuid>,
}

fn valid_priority(p: &str) -> bool {
    matches!(p, "high" | "medium" | "low")
}

async fn staff_create_task_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    body: web::Json<CreateStaffTaskDTO>,
) -> Result<ApiResponse<StaffTaskDTO>, ApiError> {
    let b = body.into_inner();
    let title = b.title.trim().to_string();
    if title.is_empty() || title.chars().count() > 200 {
        return Err(ApiError::new("A task needs a title of up to 200 characters", 400));
    }
    let priority = b.priority.unwrap_or_else(|| "medium".to_string());
    if !valid_priority(&priority) {
        return Err(ApiError::new("Priority must be high, medium or low", 400));
    }
    if let Some(booking_id) = b.booking_id {
        ensure_staff_access(&pool, &claims, booking_id).await?;
    }
    let assignee = if claims.role == ADMIN { b.assigned_to.unwrap_or(claims.sub) } else { claims.sub };
    let id: Uuid = sqlx::query_scalar(
        r#"INSERT INTO tasks (booking_id, customer_id, assigned_to, title, description, due_at, priority, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id"#,
    )
    .bind(b.booking_id)
    .bind(b.customer_id)
    .bind(assignee)
    .bind(title)
    .bind(b.description.map(|d| d.trim().to_string()).filter(|d| !d.is_empty()))
    .bind(b.due_at)
    .bind(priority)
    .bind(claims.sub)
    .fetch_one(pool.get_ref())
    .await
    .map_err(db_err)?;
    let row = sqlx::query_as::<_, StaffTaskDTO>(&format!("{TASK_SELECT} WHERE t.id = $1"))
        .bind(id)
        .fetch_one(pool.get_ref())
        .await
        .map_err(db_err)?;
    Ok(ApiResponse(row))
}

#[derive(Debug, Deserialize)]
pub struct UpdateStaffTaskDTO {
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub priority: Option<String>,
    #[serde(default)]
    pub due_at: Option<DateTime<Utc>>,
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
}

async fn staff_update_task_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
    body: web::Json<UpdateStaffTaskDTO>,
) -> Result<ApiResponse<StaffTaskDTO>, ApiError> {
    let id = path.into_inner();
    let b = body.into_inner();
    if let Some(status) = &b.status {
        if !matches!(status.as_str(), "pending" | "in_progress" | "done" | "cancelled") {
            return Err(ApiError::new("Invalid task status", 400));
        }
    }
    if b.priority.as_deref().is_some_and(|p| !valid_priority(p)) {
        return Err(ApiError::new("Priority must be high, medium or low", 400));
    }
    if b.title.as_deref().is_some_and(|t| t.trim().is_empty()) {
        return Err(ApiError::new("A task needs a title", 400));
    }
    let owner: Option<Uuid> = sqlx::query_scalar("SELECT assigned_to FROM tasks WHERE id = $1")
        .bind(id)
        .fetch_optional(pool.get_ref())
        .await
        .map_err(db_err)?;
    let Some(owner) = owner else { return Err(ApiError::new("Task not found", 404)) };
    if claims.role != ADMIN && owner != claims.sub {
        return Err(ApiError::new("This task is not assigned to you", 403));
    }
    sqlx::query(
        r#"UPDATE tasks SET
               status = COALESCE($2, status),
               priority = COALESCE($3, priority),
               due_at = COALESCE($4, due_at),
               title = COALESCE($5, title),
               description = COALESCE($6, description),
               completed_at = CASE WHEN $2 = 'done' THEN COALESCE(completed_at, NOW())
                                   WHEN $2 IS NOT NULL THEN NULL ELSE completed_at END
           WHERE id = $1"#,
    )
    .bind(id)
    .bind(b.status)
    .bind(b.priority)
    .bind(b.due_at)
    .bind(b.title.map(|t| t.trim().to_string()))
    .bind(b.description.map(|d| d.trim().to_string()))
    .execute(pool.get_ref())
    .await
    .map_err(db_err)?;
    let row = sqlx::query_as::<_, StaffTaskDTO>(&format!("{TASK_SELECT} WHERE t.id = $1"))
        .bind(id)
        .fetch_one(pool.get_ref())
        .await
        .map_err(db_err)?;
    Ok(ApiResponse(row))
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct StaffCustomerDTO {
    pub id: Uuid,
    pub name: String,
    pub phone: String,
    pub membership_code: String,
    pub membership_tier: String,
    pub tokens: i32,
    pub lifetime_wings: i64,
    pub joined_at: DateTime<Utc>,
    pub is_active: bool,
    pub bookings: i64,
    pub next_followup: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct StaffCustomerQuery {
    #[serde(default)]
    pub q: Option<String>,
}

/// Admins see every customer; employees only the customers whose bookings are
/// assigned to them.
async fn staff_customers_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    query: web::Query<StaffCustomerQuery>,
) -> Result<ApiResponse<Vec<StaffCustomerDTO>>, ApiError> {
    let q = query.q.as_deref().map(str::trim).filter(|v| !v.is_empty()).map(|v| format!("%{}%", v.to_lowercase()));
    let rows = sqlx::query_as::<_, StaffCustomerDTO>(
        r#"SELECT u.id, TRIM(u.first_name || ' ' || COALESCE(u.last_name, '')) AS name, u.phone, u.membership_code,
                  u.membership_tier, u.tokens, u.lifetime_points_earned AS lifetime_wings, u.joined_at, u.is_active,
                  (SELECT COUNT(*) FROM bookings b WHERE b.user_id = u.id) AS bookings,
                  (SELECT MIN(t.due_at) FROM tasks t WHERE t.status IN ('pending', 'in_progress')
                       AND (t.customer_id = u.id OR t.booking_id IN (SELECT id FROM bookings WHERE user_id = u.id))
                       AND ($2 OR t.assigned_to = $1)) AS next_followup
           FROM users u
           WHERE u.role = 'customer'
             AND ($2 OR EXISTS (SELECT 1 FROM bookings b WHERE b.user_id = u.id AND b.assigned_employee_id = $1))
             AND ($3::text IS NULL OR LOWER(u.first_name || ' ' || COALESCE(u.last_name, '')) LIKE $3
                  OR u.phone LIKE $3 OR LOWER(u.membership_code) LIKE $3)
           ORDER BY u.joined_at DESC LIMIT 300"#,
    )
    .bind(claims.sub)
    .bind(claims.role == ADMIN)
    .bind(q)
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(rows))
}

// ---------------------------------------------------------------------------
// Public program facts (landing page)
// ---------------------------------------------------------------------------

/// Unauthenticated, read-only summary of the Wings program so the public
/// landing page can show the real, admin-configured rates instead of copy
/// that drifts out of date.
async fn public_program_handler(pool: web::Data<PgPool>) -> Result<ApiResponse<Value>, ApiError> {
    let rows: Vec<(String, i32)> = sqlx::query_as("SELECT key, points FROM points_config")
        .fetch_all(pool.get_ref())
        .await
        .map_err(db_err)?;
    let get = |key: &str| rows.iter().find(|(k, _)| k == key).map(|(_, v)| *v);
    let services: Vec<Value> = rows
        .iter()
        .filter(|(k, _)| !matches!(k.as_str(), "welcome_bonus" | "first_booking" | "referral_booking"))
        .map(|(k, v)| json!({ "type": k, "points": v }))
        .collect();
    Ok(ApiResponse(json!({
        "welcome_bonus": get("welcome_bonus"),
        "first_booking": get("first_booking"),
        "referral_booking": get("referral_booking"),
        "services": services,
    })))
}

pub fn portal_routes(cfg: &mut ServiceConfig) {
    cfg.route("/public/program", web::get().to(public_program_handler)).service(
        web::scope("/pin-reset")
            .route("/request", web::post().to(pin_reset_request_handler))
            .route("/verify", web::post().to(pin_reset_verify_handler))
            .route("/confirm", web::post().to(pin_reset_confirm_handler)),
    )
    .service(
        web::scope("/preferences")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, &[]).await
            }))
            .route("/me", web::get().to(get_preferences_handler))
            .route("/me", web::put().to(update_preferences_handler)),
    )
    .service(
        web::scope("/sessions")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, &[]).await
            }))
            .route("/revoke-others", web::post().to(revoke_other_sessions_handler)),
    )
    .service(
        web::scope("/portal/bookings")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, &[]).await
            }))
            .route("", web::get().to(super::member::bookings_summary_handler))
            .route("/{id}", web::get().to(portal_booking_handler))
            .route("/{id}/messages", web::get().to(super::member::customer_messages_handler))
            .route("/{id}/messages", web::post().to(super::member::customer_send_message_handler))
            .route("/{id}/quote/accept", web::post().to(accept_quote_handler))
            .route("/{id}/quote/change", web::post().to(request_quote_change_handler)),
    )
    .service(
        web::scope("/portal/staff/bookings")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, STAFF).await
            }))
            .route("/{id}/quotes", web::get().to(staff_list_quotes_handler))
            .route("/{id}/quotes", web::post().to(staff_create_quote_handler))
            .route("/{id}/events", web::get().to(staff_events_handler))
            .route("/{id}/messages", web::get().to(super::member::staff_messages_handler))
            .route("/{id}/messages", web::post().to(super::member::staff_send_message_handler)),
    )
    .service(
        web::scope("/portal/staff")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, STAFF).await
            }))
            .route("/tasks", web::get().to(staff_tasks_handler))
            .route("/tasks", web::post().to(staff_create_task_handler))
            .route("/tasks/{id}", web::patch().to(staff_update_task_handler))
            .route("/customers", web::get().to(staff_customers_handler)),
    );
}
