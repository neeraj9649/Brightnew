use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};
use chrono::{DateTime, Utc};
use serde::Serialize;
use serde_json::json;

use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use auth::domain::models::user::UpdateUser;
use auth::domain::services::user::UserService;
use bookings::domain::services::booking::BookingService;
use rewards::domain::services::rewards::RewardsService;

use base::error::{ApiError, ApiResponse};
use base::jwt_claims::JwtClaims;

#[derive(Debug, Serialize)]
pub struct NotificationDTO {
    pub id: String,
    /// success | info | warning -- drives the dot colour in the UI.
    pub kind: String,
    pub title: String,
    pub message: String,
    pub icon: String,
    pub created_at: DateTime<Utc>,
    pub read: bool,
}

#[derive(Debug, Serialize)]
pub struct NotificationsDTO {
    pub items: Vec<NotificationDTO>,
    pub unread: i64,
}

fn humanize(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for (i, word) in s.split('_').enumerate() {
        if i > 0 {
            out.push(' ');
        }
        let mut chars = word.chars();
        if let Some(first) = chars.next() {
            out.extend(first.to_uppercase());
            out.push_str(chars.as_str());
        }
    }
    out
}

/// Derives the customer's notification feed live from their bookings (status)
/// and reward ledger -- no stored notifications table. "Unread" is anything
/// newer than `users.notifications_seen_at` (NULL = everything unread).
async fn my_notifications_handler(
    user_service: web::Data<dyn UserService>,
    booking_service: web::Data<dyn BookingService>,
    rewards_service: web::Data<dyn RewardsService>,
    claims: JwtClaims,
) -> Result<ApiResponse<NotificationsDTO>, ApiError> {
    let user = user_service.get(claims.sub).await?;
    let bookings = booking_service.list_for_user(claims.sub).await?;
    let rewards = rewards_service.history(claims.sub).await?;
    let seen_at = user.notifications_seen_at;

    let mut items: Vec<NotificationDTO> = Vec::new();

    for b in &bookings {
        let (kind, title, icon) = match b.status.as_str() {
            "booking_confirmed" => ("success", "Booking Confirmed!", "fa-check-circle"),
            "completed" => ("success", "Trip Completed", "fa-flag-checkered"),
            "cancelled" => ("warning", "Booking Cancelled", "fa-times-circle"),
            _ => ("info", "Booking Update", "fa-clock"),
        };
        items.push(NotificationDTO {
            id: format!("booking-{}", b.id),
            kind: kind.to_string(),
            title: title.to_string(),
            message: format!(
                "Your {} booking {} is now {}.",
                humanize(&b.booking_type),
                b.display_code,
                humanize(&b.status)
            ),
            icon: icon.to_string(),
            created_at: b.updated_at,
            read: seen_at.map(|s| b.updated_at <= s).unwrap_or(false),
        });
    }

    for r in &rewards {
        if r.points == 0 {
            continue;
        }
        let earned = r.points > 0;
        let message = r.description.clone().unwrap_or_else(|| {
            if earned {
                format!("You earned {} Wings ({}).", r.points, humanize(&r.reason))
            } else {
                format!("You redeemed {} Wings ({}).", r.points.abs(), humanize(&r.reason))
            }
        });
        items.push(NotificationDTO {
            id: format!("reward-{}", r.id),
            kind: "success".to_string(),
            title: if earned { "Wings Earned" } else { "Wings Redeemed" }.to_string(),
            message,
            icon: "fa-coins".to_string(),
            created_at: r.created_at,
            read: seen_at.map(|s| r.created_at <= s).unwrap_or(false),
        });
    }

    items.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    items.truncate(20);
    let unread = items.iter().filter(|i| !i.read).count() as i64;

    Ok(ApiResponse(NotificationsDTO { items, unread }))
}

/// Marks every notification seen up to now (clears the unread badge).
async fn mark_seen_handler(
    user_service: web::Data<dyn UserService>,
    claims: JwtClaims,
) -> Result<ApiResponse<serde_json::Value>, ApiError> {
    user_service
        .update(UpdateUser {
            id: claims.sub,
            notifications_seen_at: Some(Utc::now()),
            ..Default::default()
        })
        .await?;
    Ok(ApiResponse(json!({ "seen": true })))
}

pub fn notifications_routes(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/notifications")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, &[]).await
            }))
            .route("/me", web::get().to(my_notifications_handler))
            .route("/mark-seen", web::post().to(mark_seen_handler)),
    );
}
