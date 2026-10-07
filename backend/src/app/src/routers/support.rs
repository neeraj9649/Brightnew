use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sqlx::Row;
use uuid::Uuid;

use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use base::{
    error::{ApiError, ApiResponse},
    jwt_claims::JwtClaims,
};

#[derive(Debug, Deserialize)]
pub struct CreateSupportTicketDTO {
    pub category: String,
    #[serde(default)]
    pub booking_id: Option<Uuid>,
    #[serde(default)]
    pub redemption_id: Option<Uuid>,
    pub subject: String,
    pub message: String,
    #[serde(default)]
    pub attachments: Option<Value>,
}

#[derive(Debug, Serialize)]
pub struct SupportTicketDTO {
    pub id: Uuid,
    pub category: String,
    pub booking_id: Option<Uuid>,
    pub redemption_id: Option<Uuid>,
    pub subject: String,
    pub message: String,
    pub attachments: Value,
    pub status: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

fn validate_payload(body: &CreateSupportTicketDTO) -> Result<(), ApiError> {
    if body.category.trim().is_empty()
        || body.subject.trim().is_empty()
        || body.message.trim().is_empty()
    {
        return Err(ApiError::new(
            "Category, subject and message are required",
            400,
        ));
    }
    if body.subject.chars().count() > 180 || body.message.chars().count() > 5000 {
        return Err(ApiError::new("Support request is too long", 400));
    }
    Ok(())
}

fn map_ticket(row: &sqlx::postgres::PgRow) -> Result<SupportTicketDTO, sqlx::Error> {
    Ok(SupportTicketDTO {
        id: row.try_get("id")?,
        category: row.try_get("category")?,
        booking_id: row.try_get("booking_id")?,
        redemption_id: row.try_get("redemption_id")?,
        subject: row.try_get("subject")?,
        message: row.try_get("message")?,
        attachments: row.try_get("attachments")?,
        status: row.try_get("status")?,
        created_at: row.try_get("created_at")?,
        updated_at: row.try_get("updated_at")?,
    })
}

async fn create_ticket_handler(
    pool: web::Data<sqlx::PgPool>,
    claims: JwtClaims,
    body: web::Json<CreateSupportTicketDTO>,
) -> Result<ApiResponse<SupportTicketDTO>, ApiError> {
    validate_payload(&body)?;
    let attachments = body
        .attachments
        .clone()
        .unwrap_or_else(|| Value::Array(Vec::new()));
    let row = sqlx::query(
        "INSERT INTO support_tickets (customer_id, category, booking_id, redemption_id, subject, message, attachments) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, category, booking_id, redemption_id, subject, message, attachments, status, created_at, updated_at",
    )
    .bind(claims.sub)
    .bind(body.category.trim())
    .bind(body.booking_id)
    .bind(body.redemption_id)
    .bind(body.subject.trim())
    .bind(body.message.trim())
    .bind(attachments)
    .fetch_one(pool.get_ref())
    .await?;
    Ok(ApiResponse(map_ticket(&row)?))
}

async fn list_tickets_handler(
    pool: web::Data<sqlx::PgPool>,
    claims: JwtClaims,
) -> Result<ApiResponse<Vec<SupportTicketDTO>>, ApiError> {
    let rows = sqlx::query(
        "SELECT id, category, booking_id, redemption_id, subject, message, attachments, status, created_at, updated_at FROM support_tickets WHERE customer_id = $1 ORDER BY created_at DESC",
    )
    .bind(claims.sub)
    .fetch_all(pool.get_ref())
    .await?;
    let tickets = rows.iter().map(map_ticket).collect::<Result<Vec<_>, _>>()?;
    Ok(ApiResponse(tickets))
}

pub fn support_routes(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/support")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, &[]).await
            }))
            .route("/tickets", web::post().to(create_ticket_handler))
            .route("/tickets/me", web::get().to(list_tickets_handler)),
    );
}
