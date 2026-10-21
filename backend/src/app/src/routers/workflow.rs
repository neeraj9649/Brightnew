//! Staff workflow endpoints: booking steps the customer can read, Wings requests that need admin
//! approval, offers shown to customers, and recording a booking on a customer's behalf.
//! Like `portal.rs` these talk to Postgres directly (they span bookings, users and rewards).

use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};
use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use base::{
    error::{ApiError, ApiResponse},
    jwt_claims::JwtClaims,
    role::{self, EMPLOYEE},
};
use bookings::api::dto::booking::{BookingDTO, CreateBookingDTO, StaffCreateBookingDTO};
use bookings::domain::services::booking::BookingService;
use rewards::domain::models::reward_transaction::RewardReason;
use rewards::domain::services::rewards::RewardsService;

use super::member::booking_party;
use super::portal::ensure_staff_access;

fn db_err(e: sqlx::Error) -> ApiError {
    ApiError::new(e.to_string(), 500)
}

// ---------------------------------------------------------------------------
// Recording a booking for a customer
// ---------------------------------------------------------------------------

/// The active staff member a customer is associated with, if any.
async fn associated_staff_of(pool: &PgPool, customer_id: Uuid) -> Result<Option<Uuid>, ApiError> {
    sqlx::query_scalar::<_, Uuid>(
        "SELECT s.id FROM users c JOIN users s ON s.id = c.associated_staff_id
         WHERE c.id = $1 AND s.is_active AND s.role IN ('employee', 'admin', 'super_admin')",
    )
    .bind(customer_id)
    .fetch_optional(pool)
    .await
    .map_err(db_err)
}

/// Hands a booking that has no owner yet to the customer's associated staff member (and moves it from
/// `new` to `assigned`). Returns who it was assigned to.
async fn assign_to_associated_staff(pool: &PgPool, booking: &mut BookingDTO) -> Result<(), ApiError> {
    if booking.assigned_employee_id.is_some() {
        return Ok(());
    }
    let Some(staff) = associated_staff_of(pool, booking.user_id).await? else {
        return Ok(());
    };
    let status: Option<String> = sqlx::query_scalar(
        "UPDATE bookings SET assigned_employee_id = $2, status = CASE WHEN status = 'new' THEN 'assigned' ELSE status END
         WHERE id = $1 AND assigned_employee_id IS NULL RETURNING status",
    )
    .bind(booking.id)
    .bind(staff)
    .fetch_optional(pool)
    .await
    .map_err(db_err)?;
    if let Some(status) = status {
        booking.assigned_employee_id = Some(staff);
        booking.status = status;
    }
    Ok(())
}

/// A customer's own booking request goes straight to the staff member they are associated with.
pub async fn customer_create_booking_handler(
    booking_service: web::Data<dyn BookingService>,
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    body: web::Json<CreateBookingDTO>,
) -> Result<ApiResponse<BookingDTO>, ApiError> {
    let booking = booking_service.create(body.into_inner().into_entity(claims.sub)).await?;
    let mut dto: BookingDTO = booking.into();
    assign_to_associated_staff(pool.get_ref(), &mut dto).await?;
    Ok(ApiResponse(dto))
}

/// Staff create a booking for a customer. The staff member is stored as the one who recorded it, and an
/// employee who records a booking is also assigned to it, so it shows up in their pipeline and the
/// customer's messages reach them. When an admin records it, it goes to the customer's associated staff member.
pub async fn staff_record_booking_handler(
    booking_service: web::Data<dyn BookingService>,
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    body: web::Json<StaffCreateBookingDTO>,
) -> Result<ApiResponse<BookingDTO>, ApiError> {
    let body = body.into_inner();
    let booking = booking_service.create(body.booking.into_entity(body.user_id)).await?;
    let mut dto: BookingDTO = booking.into();
    let assign = claims.role == EMPLOYEE;
    sqlx::query(
        "UPDATE bookings SET recorded_by = $1, assigned_employee_id = CASE WHEN $3 THEN $1 ELSE assigned_employee_id END WHERE id = $2",
    )
    .bind(claims.sub)
    .bind(dto.id)
    .bind(assign)
    .execute(pool.get_ref())
    .await
    .map_err(db_err)?;
    if assign {
        dto.assigned_employee_id = Some(claims.sub);
    } else {
        assign_to_associated_staff(pool.get_ref(), &mut dto).await?;
    }
    Ok(ApiResponse(dto))
}

// ---------------------------------------------------------------------------
// Booking steps
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct StepDTO {
    pub id: Uuid,
    pub position: i32,
    pub title: String,
    pub details: Option<String>,
    pub status: String,
    pub completed_at: Option<DateTime<Utc>>,
}

const STEP_COLS: &str = "id, position, title, details, status, completed_at";

#[derive(Debug, Deserialize)]
pub struct CreateStepDTO {
    pub title: String,
    #[serde(default)]
    pub details: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateStepDTO {
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub details: Option<String>,
    #[serde(default)]
    pub status: Option<String>,
}

async fn list_steps(pool: &PgPool, booking_id: Uuid) -> Result<Vec<StepDTO>, ApiError> {
    sqlx::query_as::<_, StepDTO>(&format!(
        "SELECT {STEP_COLS} FROM booking_steps WHERE booking_id = $1 ORDER BY position, created_at"
    ))
    .bind(booking_id)
    .fetch_all(pool)
    .await
    .map_err(db_err)
}

/// Customer: the steps on one of their own bookings.
pub async fn customer_steps_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<Vec<StepDTO>>, ApiError> {
    let id = path.into_inner();
    booking_party(&pool, &claims, id, false).await?;
    Ok(ApiResponse(list_steps(&pool, id).await?))
}

pub async fn staff_steps_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<Vec<StepDTO>>, ApiError> {
    let id = path.into_inner();
    ensure_staff_access(&pool, &claims, id).await?;
    Ok(ApiResponse(list_steps(&pool, id).await?))
}

fn clean(value: Option<String>, max: usize) -> Option<String> {
    value.map(|v| v.trim().chars().take(max).collect::<String>()).filter(|v| !v.is_empty())
}

pub async fn staff_add_step_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
    body: web::Json<CreateStepDTO>,
) -> Result<ApiResponse<StepDTO>, ApiError> {
    let id = path.into_inner();
    ensure_staff_access(&pool, &claims, id).await?;
    let body = body.into_inner();
    let Some(title) = clean(Some(body.title), 160) else {
        return Err(ApiError::new("Enter a title for the step", 400));
    };
    let step = sqlx::query_as::<_, StepDTO>(&format!(
        "INSERT INTO booking_steps (booking_id, position, title, details, created_by)
         VALUES ($1, COALESCE((SELECT MAX(position) + 1 FROM booking_steps WHERE booking_id = $1), 1), $2, $3, $4)
         RETURNING {STEP_COLS}"
    ))
    .bind(id)
    .bind(title)
    .bind(clean(body.details, 1000))
    .bind(claims.sub)
    .fetch_one(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(step))
}

pub async fn staff_update_step_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    path: web::Path<(Uuid, Uuid)>,
    body: web::Json<UpdateStepDTO>,
) -> Result<ApiResponse<StepDTO>, ApiError> {
    let (booking_id, step_id) = path.into_inner();
    ensure_staff_access(&pool, &claims, booking_id).await?;
    let body = body.into_inner();
    if let Some(status) = body.status.as_deref() {
        if !matches!(status, "pending" | "done") {
            return Err(ApiError::new("Invalid step status", 400));
        }
    }
    let step = sqlx::query_as::<_, StepDTO>(&format!(
        "UPDATE booking_steps SET
            title = COALESCE($3, title),
            details = CASE WHEN $4 THEN $5 ELSE details END,
            status = COALESCE($6, status),
            completed_at = CASE WHEN $6 = 'done' AND status <> 'done' THEN NOW() WHEN $6 = 'pending' THEN NULL ELSE completed_at END
         WHERE id = $1 AND booking_id = $2
         RETURNING {STEP_COLS}"
    ))
    .bind(step_id)
    .bind(booking_id)
    .bind(clean(body.title, 160))
    .bind(body.details.is_some())
    .bind(clean(body.details, 1000))
    .bind(body.status.as_deref())
    .fetch_optional(pool.get_ref())
    .await
    .map_err(db_err)?
    .ok_or_else(|| ApiError::new("Step not found", 404))?;
    if body.status.as_deref() == Some("done") {
        sqlx::query("INSERT INTO booking_events (booking_id, actor_id, kind, message) VALUES ($1, $2, 'step', $3)")
            .bind(booking_id)
            .bind(claims.sub)
            .bind(format!("Step completed: {}", step.title))
            .execute(pool.get_ref())
            .await
            .map_err(db_err)?;
    }
    Ok(ApiResponse(step))
}

pub async fn staff_delete_step_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    path: web::Path<(Uuid, Uuid)>,
) -> Result<ApiResponse<Value>, ApiError> {
    let (booking_id, step_id) = path.into_inner();
    ensure_staff_access(&pool, &claims, booking_id).await?;
    sqlx::query("DELETE FROM booking_steps WHERE id = $1 AND booking_id = $2")
        .bind(step_id)
        .bind(booking_id)
        .execute(pool.get_ref())
        .await
        .map_err(db_err)?;
    Ok(ApiResponse(json!({ "deleted": true })))
}

fn default_steps(kind: &str) -> Vec<(&'static str, &'static str)> {
    let common_end = [("Receive your documents", "Your tickets, vouchers and invoice appear under Documents on this page.")];
    let mut steps: Vec<(&'static str, &'static str)> = match kind {
        "flight" => vec![
            ("Share traveller details", "Send each traveller's name exactly as on the passport or ID, and a contact number."),
            ("Review your quotation", "Check the fare options your advisor sends and accept or ask for a change."),
            ("Complete payment", "Pay the confirmed fare to your advisor using the method they share."),
            ("Check in before the flight", "Web check-in usually opens 48 hours before departure; carry a valid photo ID."),
        ],
        "visa" => vec![
            ("Prepare your documents", "Passport (6+ months validity), photographs and the supporting documents your advisor lists."),
            ("Submit your application", "Your advisor files the application once the documents are complete."),
            ("Track the decision", "We update this page when there is news from the embassy or visa centre."),
        ],
        "hotel" => vec![
            ("Confirm your stay details", "Check the dates, room type and guest names on your quotation."),
            ("Complete payment", "Pay to confirm the reservation using the method your advisor shares."),
            ("Carry your voucher", "Show the hotel voucher and a photo ID at check-in."),
        ],
        "airport_transfer" => vec![
            ("Confirm pickup details", "Share the exact pickup point, time and flight number."),
            ("Meet your driver", "The driver's name and number are shared before the pickup."),
        ],
        _ => vec![
            ("Confirm your requirements", "Check the itinerary and inclusions your advisor sends."),
            ("Review your quotation", "Accept the quotation or ask for changes."),
            ("Complete payment", "Pay the confirmed amount using the method your advisor shares."),
        ],
    };
    steps.extend(common_end);
    steps
}

pub async fn staff_default_steps_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<Vec<StepDTO>>, ApiError> {
    let id = path.into_inner();
    ensure_staff_access(&pool, &claims, id).await?;
    let kind: String = sqlx::query_scalar("SELECT type FROM bookings WHERE id = $1")
        .bind(id)
        .fetch_one(pool.get_ref())
        .await
        .map_err(db_err)?;
    let existing: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM booking_steps WHERE booking_id = $1")
        .bind(id)
        .fetch_one(pool.get_ref())
        .await
        .map_err(db_err)?;
    if existing == 0 {
        for (i, (title, details)) in default_steps(&kind).into_iter().enumerate() {
            sqlx::query("INSERT INTO booking_steps (booking_id, position, title, details, created_by) VALUES ($1, $2, $3, $4, $5)")
                .bind(id)
                .bind(i as i32 + 1)
                .bind(title)
                .bind(details)
                .bind(claims.sub)
                .execute(pool.get_ref())
                .await
                .map_err(db_err)?;
        }
    }
    Ok(ApiResponse(list_steps(&pool, id).await?))
}

// ---------------------------------------------------------------------------
// Wings requests (manual Wings need an admin's approval)
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct WingsRequestDTO {
    pub id: Uuid,
    pub booking_id: Option<Uuid>,
    pub booking_code: Option<String>,
    pub customer_id: Uuid,
    pub customer_name: String,
    pub customer_code: String,
    pub requested_by: Uuid,
    pub requested_by_name: String,
    pub points: i32,
    pub reason: String,
    pub status: String,
    pub review_note: Option<String>,
    pub reviewed_by_name: Option<String>,
    pub reviewed_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
}

const WINGS_SELECT: &str = r#"
    SELECT w.id, w.booking_id, b.display_code AS booking_code, w.user_id AS customer_id,
           TRIM(c.first_name || ' ' || COALESCE(c.last_name, '')) AS customer_name, c.membership_code AS customer_code,
           w.requested_by, TRIM(s.first_name || ' ' || COALESCE(s.last_name, '')) AS requested_by_name,
           w.points, w.reason, w.status, w.review_note,
           (SELECT TRIM(r.first_name || ' ' || COALESCE(r.last_name, '')) FROM users r WHERE r.id = w.reviewed_by) AS reviewed_by_name,
           w.reviewed_at, w.created_at
    FROM wings_requests w
    JOIN users c ON c.id = w.user_id
    JOIN users s ON s.id = w.requested_by
    LEFT JOIN bookings b ON b.id = w.booking_id
"#;

#[derive(Debug, Deserialize)]
pub struct CreateWingsRequestDTO {
    pub booking_id: Uuid,
    pub points: i32,
    pub reason: String,
}

#[derive(Debug, Deserialize)]
pub struct WingsListQuery {
    #[serde(default)]
    pub booking_id: Option<Uuid>,
    #[serde(default)]
    pub status: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ReviewDTO {
    #[serde(default)]
    pub note: Option<String>,
}

/// Credits an approved request to the customer's wallet.
async fn credit_request(
    rewards: &dyn RewardsService,
    request_id: Uuid,
    user_id: Uuid,
    points: i32,
    reason: &str,
    approver: Uuid,
) -> Result<(), ApiError> {
    rewards
        .award(
            user_id,
            points,
            RewardReason::Manual,
            Some("wings_request".to_string()),
            Some(request_id),
            Some(format!("Bonus Wings: {reason}")),
            Some(approver),
        )
        .await?;
    Ok(())
}

/// Staff ask for extra Wings on a confirmed/completed booking. An admin's own request is approved at once.
pub async fn staff_create_wings_request_handler(
    pool: web::Data<PgPool>,
    rewards: web::Data<dyn RewardsService>,
    claims: JwtClaims,
    body: web::Json<CreateWingsRequestDTO>,
) -> Result<ApiResponse<WingsRequestDTO>, ApiError> {
    let body = body.into_inner();
    ensure_staff_access(&pool, &claims, body.booking_id).await?;
    let reason = body.reason.trim().to_string();
    if !(1..=100_000).contains(&body.points) {
        return Err(ApiError::new("Enter a number of Wings between 1 and 100,000", 400));
    }
    if reason.chars().count() < 3 {
        return Err(ApiError::new("Add a short reason for the extra Wings", 400));
    }
    let (user_id, status): (Uuid, String) = sqlx::query_as("SELECT user_id, status FROM bookings WHERE id = $1")
        .bind(body.booking_id)
        .fetch_one(pool.get_ref())
        .await
        .map_err(db_err)?;
    if !matches!(status.as_str(), "booking_confirmed" | "completed") {
        return Err(ApiError::new("Wings can be added once the booking is confirmed or completed", 400));
    }
    let id: Uuid = sqlx::query_scalar(
        "INSERT INTO wings_requests (booking_id, user_id, requested_by, points, reason) VALUES ($1, $2, $3, $4, $5) RETURNING id",
    )
    .bind(body.booking_id)
    .bind(user_id)
    .bind(claims.sub)
    .bind(body.points)
    .bind(&reason)
    .fetch_one(pool.get_ref())
    .await
    .map_err(db_err)?;
    if role::is_admin(&claims.role) {
        credit_request(rewards.get_ref(), id, user_id, body.points, &reason, claims.sub).await?;
        sqlx::query("UPDATE wings_requests SET status = 'approved', reviewed_by = $2, reviewed_at = NOW() WHERE id = $1")
            .bind(id)
            .bind(claims.sub)
            .execute(pool.get_ref())
            .await
            .map_err(db_err)?;
    }
    let dto = sqlx::query_as::<_, WingsRequestDTO>(&format!("{WINGS_SELECT} WHERE w.id = $1"))
        .bind(id)
        .fetch_one(pool.get_ref())
        .await
        .map_err(db_err)?;
    Ok(ApiResponse(dto))
}

/// Staff: their own requests (all of them for an admin), optionally for one booking.
pub async fn staff_list_wings_requests_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    query: web::Query<WingsListQuery>,
) -> Result<ApiResponse<Vec<WingsRequestDTO>>, ApiError> {
    let rows = sqlx::query_as::<_, WingsRequestDTO>(&format!(
        "{WINGS_SELECT} WHERE ($1 OR w.requested_by = $2) AND ($3::uuid IS NULL OR w.booking_id = $3) ORDER BY w.created_at DESC LIMIT 200"
    ))
    .bind(role::is_admin(&claims.role))
    .bind(claims.sub)
    .bind(query.booking_id)
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(rows))
}

/// Admin: the approval queue.
pub async fn admin_list_wings_requests_handler(
    pool: web::Data<PgPool>,
    query: web::Query<WingsListQuery>,
) -> Result<ApiResponse<Vec<WingsRequestDTO>>, ApiError> {
    if let Some(s) = query.status.as_deref() {
        if !matches!(s, "pending" | "approved" | "rejected") {
            return Err(ApiError::new("Invalid status", 400));
        }
    }
    let rows = sqlx::query_as::<_, WingsRequestDTO>(&format!(
        "{WINGS_SELECT} WHERE ($1::text IS NULL OR w.status = $1) ORDER BY w.created_at DESC LIMIT 300"
    ))
    .bind(query.status.as_deref())
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(rows))
}

pub async fn admin_approve_wings_handler(
    pool: web::Data<PgPool>,
    rewards: web::Data<dyn RewardsService>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
    body: web::Json<ReviewDTO>,
) -> Result<ApiResponse<WingsRequestDTO>, ApiError> {
    let id = path.into_inner();
    // Claim the request first so two admins can't credit it twice.
    let claimed: Option<(Uuid, i32, String)> = sqlx::query_as(
        "UPDATE wings_requests SET status = 'approved', reviewed_by = $2, reviewed_at = NOW(), review_note = $3
         WHERE id = $1 AND status = 'pending' RETURNING user_id, points, reason",
    )
    .bind(id)
    .bind(claims.sub)
    .bind(clean(body.into_inner().note, 300))
    .fetch_optional(pool.get_ref())
    .await
    .map_err(db_err)?;
    let Some((user_id, points, reason)) = claimed else {
        return Err(ApiError::new("This request was already reviewed", 409));
    };
    if let Err(err) = credit_request(rewards.get_ref(), id, user_id, points, &reason, claims.sub).await {
        sqlx::query("UPDATE wings_requests SET status = 'pending', reviewed_by = NULL, reviewed_at = NULL WHERE id = $1")
            .bind(id)
            .execute(pool.get_ref())
            .await
            .map_err(db_err)?;
        return Err(err);
    }
    let dto = sqlx::query_as::<_, WingsRequestDTO>(&format!("{WINGS_SELECT} WHERE w.id = $1"))
        .bind(id)
        .fetch_one(pool.get_ref())
        .await
        .map_err(db_err)?;
    Ok(ApiResponse(dto))
}

pub async fn admin_reject_wings_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
    body: web::Json<ReviewDTO>,
) -> Result<ApiResponse<WingsRequestDTO>, ApiError> {
    let id = path.into_inner();
    let done = sqlx::query(
        "UPDATE wings_requests SET status = 'rejected', reviewed_by = $2, reviewed_at = NOW(), review_note = $3
         WHERE id = $1 AND status = 'pending'",
    )
    .bind(id)
    .bind(claims.sub)
    .bind(clean(body.into_inner().note, 300))
    .execute(pool.get_ref())
    .await
    .map_err(db_err)?;
    if done.rows_affected() == 0 {
        return Err(ApiError::new("This request was already reviewed", 409));
    }
    let dto = sqlx::query_as::<_, WingsRequestDTO>(&format!("{WINGS_SELECT} WHERE w.id = $1"))
        .bind(id)
        .fetch_one(pool.get_ref())
        .await
        .map_err(db_err)?;
    Ok(ApiResponse(dto))
}

/// Staff: what the booking earns automatically (from the program list) and what has been requested on top.
pub async fn staff_booking_wings_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<Value>, ApiError> {
    let id = path.into_inner();
    ensure_staff_access(&pool, &claims, id).await?;
    let kind: String = sqlx::query_scalar("SELECT type FROM bookings WHERE id = $1")
        .bind(id)
        .fetch_one(pool.get_ref())
        .await
        .map_err(db_err)?;
    let standard = rewards::domain::points_config::points_for_booking_type(pool.get_ref(), &kind).await;
    let awarded: i64 = sqlx::query_scalar(
        "SELECT COALESCE(SUM(points), 0)::BIGINT FROM reward_transactions WHERE source_id = $1 AND points > 0",
    )
    .bind(id)
    .fetch_one(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(json!({ "standard_points": standard, "awarded_automatically": awarded, "booking_type": kind })))
}

// ---------------------------------------------------------------------------
// Offers
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct OfferDTO {
    pub id: Uuid,
    pub title: String,
    pub description: Option<String>,
    pub badge: Option<String>,
    pub code: Option<String>,
    pub image_file_id: Option<String>,
    pub service_type: Option<String>,
    pub valid_from: Option<NaiveDate>,
    pub valid_until: Option<NaiveDate>,
    pub is_active: bool,
    pub created_at: DateTime<Utc>,
}

const OFFER_COLS: &str =
    "id, title, description, badge, code, image_file_id, service_type, valid_from, valid_until, is_active, created_at";

#[derive(Debug, Deserialize)]
pub struct OfferInput {
    pub title: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub badge: Option<String>,
    #[serde(default)]
    pub code: Option<String>,
    #[serde(default)]
    pub image_file_id: Option<String>,
    #[serde(default)]
    pub service_type: Option<String>,
    #[serde(default)]
    pub valid_from: Option<NaiveDate>,
    #[serde(default)]
    pub valid_until: Option<NaiveDate>,
    #[serde(default)]
    pub is_active: Option<bool>,
}

fn validate_offer(o: &OfferInput) -> Result<(), ApiError> {
    if o.title.trim().chars().count() < 3 {
        return Err(ApiError::new("Give the offer a title", 400));
    }
    if let (Some(from), Some(until)) = (o.valid_from, o.valid_until) {
        if until < from {
            return Err(ApiError::new("The end date can't be before the start date", 400));
        }
    }
    Ok(())
}

const ACTIVE_OFFERS: &str =
    "is_active AND (valid_from IS NULL OR valid_from <= CURRENT_DATE) AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)";

/// Customers: the offers that are live today.
pub async fn customer_offers_handler(pool: web::Data<PgPool>) -> Result<ApiResponse<Vec<OfferDTO>>, ApiError> {
    let rows = sqlx::query_as::<_, OfferDTO>(&format!(
        "SELECT {OFFER_COLS} FROM offers WHERE {ACTIVE_OFFERS} ORDER BY created_at DESC LIMIT 50"
    ))
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(rows))
}

/// Public (landing page): a few live offers, without the internal fields.
pub async fn public_offers_handler(pool: web::Data<PgPool>) -> Result<ApiResponse<Vec<OfferDTO>>, ApiError> {
    let rows = sqlx::query_as::<_, OfferDTO>(&format!(
        "SELECT {OFFER_COLS} FROM offers WHERE {ACTIVE_OFFERS} ORDER BY created_at DESC LIMIT 6"
    ))
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(rows))
}

pub async fn staff_list_offers_handler(pool: web::Data<PgPool>) -> Result<ApiResponse<Vec<OfferDTO>>, ApiError> {
    let rows = sqlx::query_as::<_, OfferDTO>(&format!("SELECT {OFFER_COLS} FROM offers ORDER BY created_at DESC LIMIT 200"))
        .fetch_all(pool.get_ref())
        .await
        .map_err(db_err)?;
    Ok(ApiResponse(rows))
}

pub async fn staff_create_offer_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    body: web::Json<OfferInput>,
) -> Result<ApiResponse<OfferDTO>, ApiError> {
    let o = body.into_inner();
    validate_offer(&o)?;
    let row = sqlx::query_as::<_, OfferDTO>(&format!(
        "INSERT INTO offers (title, description, badge, code, image_file_id, service_type, valid_from, valid_until, is_active, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING {OFFER_COLS}"
    ))
    .bind(o.title.trim())
    .bind(clean(o.description, 1000))
    .bind(clean(o.badge, 40))
    .bind(clean(o.code, 40))
    .bind(clean(o.image_file_id, 200))
    .bind(clean(o.service_type, 20))
    .bind(o.valid_from)
    .bind(o.valid_until)
    .bind(o.is_active.unwrap_or(true))
    .bind(claims.sub)
    .fetch_one(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(row))
}

pub async fn staff_update_offer_handler(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    body: web::Json<OfferInput>,
) -> Result<ApiResponse<OfferDTO>, ApiError> {
    let o = body.into_inner();
    validate_offer(&o)?;
    let row = sqlx::query_as::<_, OfferDTO>(&format!(
        "UPDATE offers SET title = $2, description = $3, badge = $4, code = $5, image_file_id = $6, service_type = $7,
                valid_from = $8, valid_until = $9, is_active = COALESCE($10, is_active), updated_at = NOW()
         WHERE id = $1 RETURNING {OFFER_COLS}"
    ))
    .bind(path.into_inner())
    .bind(o.title.trim())
    .bind(clean(o.description, 1000))
    .bind(clean(o.badge, 40))
    .bind(clean(o.code, 40))
    .bind(clean(o.image_file_id, 200))
    .bind(clean(o.service_type, 20))
    .bind(o.valid_from)
    .bind(o.valid_until)
    .bind(o.is_active)
    .fetch_optional(pool.get_ref())
    .await
    .map_err(db_err)?
    .ok_or_else(|| ApiError::new("Offer not found", 404))?;
    Ok(ApiResponse(row))
}

pub async fn staff_delete_offer_handler(pool: web::Data<PgPool>, path: web::Path<Uuid>) -> Result<ApiResponse<Value>, ApiError> {
    sqlx::query("DELETE FROM offers WHERE id = $1")
        .bind(path.into_inner())
        .execute(pool.get_ref())
        .await
        .map_err(db_err)?;
    Ok(ApiResponse(json!({ "deleted": true })))
}

// ---------------------------------------------------------------------------
// Staff association (admin)
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct StaffMemberDTO {
    pub id: Uuid,
    pub name: String,
    pub role: String,
    pub staff_code: Option<String>,
    pub customers: i64,
}

/// Active staff, for the "assign to" pickers.
pub async fn admin_list_staff_handler(pool: web::Data<PgPool>) -> Result<ApiResponse<Vec<StaffMemberDTO>>, ApiError> {
    let rows = sqlx::query_as::<_, StaffMemberDTO>(
        "SELECT s.id, TRIM(s.first_name || ' ' || COALESCE(s.last_name, '')) AS name, s.role, s.referral_code AS staff_code,
                (SELECT COUNT(*) FROM users c WHERE c.associated_staff_id = s.id AND c.role = 'customer') AS customers
         FROM users s WHERE s.role IN ('employee', 'admin', 'super_admin') AND s.is_active
         ORDER BY s.first_name, s.last_name",
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(rows))
}

#[derive(Debug, Deserialize)]
pub struct AssignStaffDTO {
    /// `null` removes the association.
    #[serde(default)]
    pub staff_id: Option<Uuid>,
}

#[derive(Debug, Deserialize)]
pub struct BulkAssignStaffDTO {
    pub customer_ids: Vec<Uuid>,
    pub staff_id: Uuid,
    /// Leave customers that already have a staff member alone (default).
    #[serde(default = "default_true")]
    pub only_unassigned: bool,
}

fn default_true() -> bool {
    true
}

async fn ensure_active_staff(pool: &PgPool, staff_id: Uuid) -> Result<(), ApiError> {
    let ok: bool = sqlx::query_scalar(
        "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1 AND is_active AND role IN ('employee', 'admin', 'super_admin'))",
    )
    .bind(staff_id)
    .fetch_one(pool)
    .await
    .map_err(db_err)?;
    if ok {
        Ok(())
    } else {
        Err(ApiError::new("Choose an active staff member", 400))
    }
}

/// Admin: set, change or clear the staff member a customer is associated with.
pub async fn admin_assign_staff_handler(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
    body: web::Json<AssignStaffDTO>,
) -> Result<ApiResponse<Value>, ApiError> {
    let customer_id = path.into_inner();
    let staff_id = body.into_inner().staff_id;
    if let Some(staff) = staff_id {
        ensure_active_staff(&pool, staff).await?;
    }
    let done = sqlx::query(
        "UPDATE users SET associated_staff_id = $2,
                association_source = CASE WHEN $2::uuid IS NULL THEN NULL ELSE 'admin' END,
                associated_at = CASE WHEN $2::uuid IS NULL THEN NULL ELSE NOW() END
         WHERE id = $1 AND role = 'customer'",
    )
    .bind(customer_id)
    .bind(staff_id)
    .execute(pool.get_ref())
    .await
    .map_err(db_err)?;
    if done.rows_affected() == 0 {
        return Err(ApiError::new("Customer not found", 404));
    }
    Ok(ApiResponse(json!({ "customer_id": customer_id, "staff_id": staff_id })))
}

/// Admin: associate many customers with one staff member at once.
pub async fn admin_bulk_assign_staff_handler(
    pool: web::Data<PgPool>,
    body: web::Json<BulkAssignStaffDTO>,
) -> Result<ApiResponse<Value>, ApiError> {
    let body = body.into_inner();
    if body.customer_ids.is_empty() || body.customer_ids.len() > 500 {
        return Err(ApiError::new("Select between 1 and 500 customers", 400));
    }
    ensure_active_staff(&pool, body.staff_id).await?;
    let done = sqlx::query(
        "UPDATE users SET associated_staff_id = $2, association_source = 'admin', associated_at = NOW()
         WHERE id = ANY($1) AND role = 'customer' AND ($3 = FALSE OR associated_staff_id IS NULL)",
    )
    .bind(&body.customer_ids)
    .bind(body.staff_id)
    .bind(body.only_unassigned)
    .execute(pool.get_ref())
    .await
    .map_err(db_err)?;
    Ok(ApiResponse(json!({ "assigned": done.rows_affected() })))
}

/// Staff: who a customer is associated with and how that came about.
pub async fn staff_customer_association_handler(
    pool: web::Data<PgPool>,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<Value>, ApiError> {
    let row: Option<(Option<Uuid>, Option<String>, Option<String>, Option<DateTime<Utc>>)> = sqlx::query_as(
        "SELECT c.associated_staff_id,
                (SELECT TRIM(s.first_name || ' ' || COALESCE(s.last_name, '')) FROM users s WHERE s.id = c.associated_staff_id),
                c.association_source, c.associated_at
         FROM users c WHERE c.id = $1 AND c.role = 'customer'",
    )
    .bind(path.into_inner())
    .fetch_optional(pool.get_ref())
    .await
    .map_err(db_err)?;
    let Some((staff_id, staff_name, source, at)) = row else {
        return Err(ApiError::new("Customer not found", 404));
    };
    Ok(ApiResponse(json!({ "staff_id": staff_id, "staff_name": staff_name, "source": source, "associated_at": at })))
}

/// Scopes that don't collide with the ones already registered in `portal.rs` / `admin_portal.rs`
/// (Actix does not fall through between scopes that share a prefix, so the rest are added there).
pub fn workflow_routes(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/portal/offers")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, &[]).await
            }))
            .route("", web::get().to(customer_offers_handler)),
    );
}
