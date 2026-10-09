//! Member-portal endpoints for the desktop experience: booking conversations,
//! the "my bookings" summary feed, account activity, e-mail and referral
//! invites. Like `portal.rs` these talk to Postgres directly because they span
//! users, bookings and CRM tables.

use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use base::{
    error::{ApiError, ApiResponse},
    jwt_claims::JwtClaims,
    role::ADMIN,
};

fn db_err(e: sqlx::Error) -> ApiError {
    ApiError::new(e.to_string(), 500)
}

// ---------------------------------------------------------------------------
// Booking conversation
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct MessageDTO {
    pub id: Uuid,
    pub sender_role: String,
    pub sender_name: String,
    pub body: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct SendMessageDTO {
    pub body: String,
}

const MESSAGE_SELECT: &str = r#"
    SELECT m.id, m.sender_role, TRIM(u.first_name || ' ' || COALESCE(u.last_name, '')) AS sender_name,
           m.body, m.created_at
    FROM booking_messages m JOIN users u ON u.id = m.sender_id
"#;

/// The booking's owner may always read and write; staff only on bookings they
/// may work (admin: all, employee: assigned).
async fn booking_party(
    pool: &PgPool,
    claims: &JwtClaims,
    booking_id: Uuid,
    as_staff: bool,
) -> Result<(Uuid, Option<Uuid>), ApiError> {
    let row: Option<(Uuid, Option<Uuid>)> =
        sqlx::query_as("SELECT user_id, assigned_employee_id FROM bookings WHERE id = $1")
            .bind(booking_id)
            .fetch_optional(pool)
            .await
            .map_err(db_err)?;
    let Some((owner, assigned)) = row else {
        return Err(ApiError::new("Booking not found", 404));
    };
    if as_staff {
        if claims.role == ADMIN || assigned == Some(claims.sub) {
            Ok((owner, assigned))
        } else {
            Err(ApiError::new("This booking is not assigned to you", 403))
        }
    } else if owner == claims.sub {
        Ok((owner, assigned))
    } else {
        Err(ApiError::new("Booking not found", 404))
    }
}

async fn list_messages(
    pool: &PgPool,
    booking_id: Uuid,
) -> Result<Vec<MessageDTO>, ApiError> {
    sqlx::query_as::<_, MessageDTO>(&format!("{MESSAGE_SELECT} WHERE m.booking_id = $1 ORDER BY m.created_at"))
        .bind(booking_id)
        .fetch_all(pool)
        .await
        .map_err(db_err)
}

async fn insert_message(
    pool: &PgPool,
    booking_id: Uuid,
    sender: Uuid,
    role: &str,
    body: &str,
) -> Result<MessageDTO, ApiError> {
    let body = body.trim();
    if body.is_empty() || body.chars().count() > 2000 {
        return Err(ApiError::new("A message must be between 1 and 2000 characters", 400));
    }
    let id: Uuid = sqlx::query_scalar(
        "INSERT INTO booking_messages (booking_id, sender_id, sender_role, body) VALUES ($1, $2, $3, $4) RETURNING id",
    )
    .bind(booking_id)
    .bind(sender)
    .bind(role)
    .bind(body)
    .fetch_one(pool)
    .await
    .map_err(db_err)?;
    sqlx::query_as::<_, MessageDTO>(&format!("{MESSAGE_SELECT} WHERE m.id = $1"))
        .bind(id)
        .fetch_one(pool)
        .await
        .map_err(db_err)
}

pub async fn customer_messages_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<Vec<MessageDTO>>, ApiError> {
    let id = path.into_inner();
    booking_party(&pool, &claims, id, false).await?;
    Ok(ApiResponse(list_messages(&pool, id).await?))
}

pub async fn customer_send_message_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
    body: web::Json<SendMessageDTO>,
) -> Result<ApiResponse<MessageDTO>, ApiError> {
    let id = path.into_inner();
    let (_, assigned) = booking_party(&pool, &claims, id, false).await?;
    let message = insert_message(&pool, id, claims.sub, "customer", &body.body).await?;
    // Make sure the advisor sees it: one open "reply" task per booking.
    if let Some(employee) = assigned {
        sqlx::query(
            r#"INSERT INTO tasks (booking_id, assigned_to, title, description, due_at, priority, created_by)
               SELECT $1, $2, 'Reply to customer message', $3, NOW() + INTERVAL '1 day', 'high', $4
               WHERE NOT EXISTS (SELECT 1 FROM tasks WHERE booking_id = $1 AND title = 'Reply to customer message'
                                 AND status IN ('pending', 'in_progress'))"#,
        )
        .bind(id)
        .bind(employee)
        .bind(&message.body)
        .bind(claims.sub)
        .execute(pool.get_ref())
        .await
        .map_err(db_err)?;
    }
    Ok(ApiResponse(message))
}

pub async fn staff_messages_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<Vec<MessageDTO>>, ApiError> {
    let id = path.into_inner();
    booking_party(&pool, &claims, id, true).await?;
    Ok(ApiResponse(list_messages(&pool, id).await?))
}

pub async fn staff_send_message_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
    body: web::Json<SendMessageDTO>,
) -> Result<ApiResponse<MessageDTO>, ApiError> {
    let id = path.into_inner();
    booking_party(&pool, &claims, id, true).await?;
    let message = insert_message(&pool, id, claims.sub, "staff", &body.body).await?;
    // Replying settles the "reply" task.
    sqlx::query(
        "UPDATE tasks SET status = 'done', completed_at = NOW() WHERE booking_id = $1 AND title = 'Reply to customer message' AND status IN ('pending', 'in_progress')",
    )
    .bind(id)
    .execute(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(message))
}

// ---------------------------------------------------------------------------
// "My bookings" summary feed
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
struct EventRow {
    booking_id: Uuid,
    kind: String,
    message: String,
    created_at: DateTime<Utc>,
}

/// One round-trip with everything the bookings list needs besides the bookings
/// themselves: advisor, milestone dates and the latest advisor message.
pub async fn bookings_summary_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
) -> Result<ApiResponse<Value>, ApiError> {
    let advisors: Vec<(Uuid, String, Option<String>, Option<String>)> = sqlx::query_as(
        r#"SELECT b.id, TRIM(a.first_name || ' ' || COALESCE(a.last_name, '')), a.phone, a.email
           FROM bookings b JOIN users a ON a.id = b.assigned_employee_id
           WHERE b.user_id = $1"#,
    )
    .bind(claims.sub)
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;
    let events: Vec<EventRow> = sqlx::query_as(
        r#"SELECT e.booking_id, e.kind, e.message, e.created_at
           FROM booking_events e JOIN bookings b ON b.id = e.booking_id
           WHERE b.user_id = $1 ORDER BY e.created_at"#,
    )
    .bind(claims.sub)
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;
    let latest: Vec<(Uuid, String, DateTime<Utc>)> = sqlx::query_as(
        r#"SELECT DISTINCT ON (m.booking_id) m.booking_id, m.body, m.created_at
           FROM booking_messages m JOIN bookings b ON b.id = m.booking_id
           WHERE b.user_id = $1 AND m.sender_role = 'staff'
           ORDER BY m.booking_id, m.created_at DESC"#,
    )
    .bind(claims.sub)
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;

    let mut map = serde_json::Map::new();
    let entry = |map: &mut serde_json::Map<String, Value>, id: Uuid| {
        map.entry(id.to_string())
            .or_insert_with(|| json!({ "advisor": null, "events": [], "latest_message": null }))
            .clone()
    };
    for (id, name, phone, email) in advisors {
        let mut v = entry(&mut map, id);
        v["advisor"] = json!({ "name": name, "phone": phone, "email": email });
        map.insert(id.to_string(), v);
    }
    for e in events {
        let mut v = entry(&mut map, e.booking_id);
        v["events"].as_array_mut().expect("events array").push(json!({ "kind": e.kind, "message": e.message, "created_at": e.created_at }));
        map.insert(e.booking_id.to_string(), v);
    }
    for (id, body, at) in latest {
        let mut v = entry(&mut map, id);
        v["latest_message"] = json!({ "body": body, "created_at": at });
        map.insert(id.to_string(), v);
    }
    Ok(ApiResponse(Value::Object(map)))
}

// ---------------------------------------------------------------------------
// Account: activity and e-mail
// ---------------------------------------------------------------------------

async fn account_activity_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
) -> Result<ApiResponse<Value>, ApiError> {
    // Every sign-in starts a new refresh-token family, so the first token of
    // each family is a sign-in. `revoked` families were signed out remotely.
    let rows: Vec<(DateTime<Utc>, bool)> = sqlx::query_as(
        r#"SELECT MIN(issued_at) AS at, BOOL_AND(is_revoked) AS revoked
           FROM refresh_tokens WHERE user_id = $1 GROUP BY family_id
           ORDER BY MIN(issued_at) DESC LIMIT 10"#,
    )
    .bind(claims.sub)
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(json!({
        "sign_ins": rows.into_iter().map(|(at, revoked)| json!({ "at": at, "signed_out": revoked })).collect::<Vec<_>>(),
    })))
}

#[derive(Debug, Deserialize)]
pub struct EmailDTO {
    #[serde(default)]
    pub email: Option<String>,
}

fn plausible_email(value: &str) -> bool {
    let mut parts = value.split('@');
    matches!((parts.next(), parts.next(), parts.next()), (Some(l), Some(d), None) if !l.is_empty() && d.contains('.') && !d.starts_with('.') && !d.ends_with('.') && !value.contains(' '))
}

async fn update_email_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    body: web::Json<EmailDTO>,
) -> Result<ApiResponse<Value>, ApiError> {
    let email = body.email.as_deref().map(|e| e.trim().to_lowercase()).filter(|e| !e.is_empty());
    if let Some(e) = &email {
        if e.len() > 200 || !plausible_email(e) {
            return Err(ApiError::new("Enter a valid e-mail address", 400));
        }
    }
    let result = sqlx::query("UPDATE users SET email = $2 WHERE id = $1")
        .bind(claims.sub)
        .bind(&email)
        .execute(pool.get_ref())
        .await;
    match result {
        Ok(_) => Ok(ApiResponse(json!({ "email": email }))),
        Err(sqlx::Error::Database(db)) if db.is_unique_violation() => {
            Err(ApiError::new("That e-mail address is already used by another member", 409))
        }
        Err(e) => Err(db_err(e)),
    }
}

// ---------------------------------------------------------------------------
// Referral invites
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
pub struct InviteDTO {
    pub email: String,
}

async fn create_invite_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    body: web::Json<InviteDTO>,
) -> Result<ApiResponse<Value>, ApiError> {
    let email = body.email.trim().to_lowercase();
    if !plausible_email(&email) || email.len() > 200 {
        return Err(ApiError::new("Enter a valid e-mail address", 400));
    }
    let (name, code, own_email): (String, Option<String>, Option<String>) = sqlx::query_as(
        "SELECT TRIM(first_name || ' ' || COALESCE(last_name, '')), referral_code, email FROM users WHERE id = $1",
    )
    .bind(claims.sub)
    .fetch_one(pool.get_ref())
    .await
    .map_err(db_err)?;
    if own_email.as_deref() == Some(email.as_str()) {
        return Err(ApiError::new("That is your own e-mail address", 400));
    }
    let already_member: bool = sqlx::query_scalar("SELECT EXISTS(SELECT 1 FROM users WHERE LOWER(email) = $1)")
        .bind(&email)
        .fetch_one(pool.get_ref())
        .await
        .map_err(db_err)?;
    if already_member {
        return Err(ApiError::new("That person is already a Bright Wings member", 409));
    }
    sqlx::query("INSERT INTO referral_invites (referrer_id, email) VALUES ($1, $2) ON CONFLICT (referrer_id, email) DO NOTHING")
        .bind(claims.sub)
        .bind(&email)
        .execute(pool.get_ref())
        .await
        .map_err(db_err)?;

    let portal = std::env::var("PORTAL_URL").unwrap_or_else(|_| "https://portal.brightwingstravel.com".to_string());
    let link = format!("{}/auth?ref={}", portal.trim_end_matches('/'), code.unwrap_or_default());
    let text = format!(
        "{name} invited you to join Bright Wings, the travel rewards program.\n\nJoin free and start with welcome Wings: {link}\n"
    );
    let to = email.clone();
    let sent = web::block(move || shared::mail::send_plain_email(&to, &format!("{name} invited you to Bright Wings"), &text))
        .await
        .map(|r| r.is_ok())
        .unwrap_or(false);
    Ok(ApiResponse(json!({ "email": email, "sent": sent })))
}

pub fn member_routes(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/portal/account")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, &[]).await
            }))
            .route("/activity", web::get().to(account_activity_handler))
            .route("/email", web::put().to(update_email_handler)),
    )
    .service(
        web::scope("/referral-invites")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, &[]).await
            }))
            .route("", web::post().to(create_invite_handler)),
    );
}
