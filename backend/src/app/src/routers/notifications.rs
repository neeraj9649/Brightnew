use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};
use chrono::{DateTime, Utc};
use serde::Serialize;
use serde_json::json;
use uuid::Uuid;

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
    /// bookings | wings -- drives the tabs in the UI.
    pub category: String,
    pub title: String,
    pub message: String,
    pub icon: String,
    /// Wings credited (+) or debited (-) by this event, when relevant.
    pub amount: Option<i32>,
    /// Portal route the notification opens.
    pub link: Option<String>,
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

fn reward_title(reason: &str, earned: bool) -> &'static str {
    match reason {
        "welcome_bonus" => "Welcome to Bright Wings!",
        "first_booking" => "First booking bonus",
        "booking" => "Wings earned on your trip",
        "referral" => "Referral bonus credited",
        "manual" if earned => "Wings added to your wallet",
        "manual" => "Wings adjusted",
        "redemption" => "Wings redeemed",
        _ if earned => "Wings earned",
        _ => "Wings redeemed",
    }
}

/// Derives the customer's notification feed live from their bookings, quotes,
/// redemptions and reward ledger -- no stored notifications table. "Unread" is
/// anything newer than `users.notifications_seen_at` (NULL = everything
/// unread). Categories the member switched off in their notification
/// preferences are left out (booking updates are always delivered).
async fn my_notifications_handler(
    pool: web::Data<sqlx::PgPool>,
    user_service: web::Data<dyn UserService>,
    booking_service: web::Data<dyn BookingService>,
    rewards_service: web::Data<dyn RewardsService>,
    claims: JwtClaims,
) -> Result<ApiResponse<NotificationsDTO>, ApiError> {
    let user = user_service.get(claims.sub).await?;
    let bookings = booking_service.list_for_user(claims.sub).await?;
    let rewards = rewards_service.history(claims.sub).await?;
    let seen_at = user.notifications_seen_at;
    let is_read = |at: DateTime<Utc>| seen_at.map(|s| at <= s).unwrap_or(false);

    let (wings_on, rewards_on): (bool, bool) = sqlx::query_as(
        "SELECT wings_activity, reward_status FROM user_preferences WHERE user_id = $1",
    )
    .bind(claims.sub)
    .fetch_optional(pool.get_ref())
    .await?
    .unwrap_or((true, true));

    let mut items: Vec<NotificationDTO> = Vec::new();

    for b in &bookings {
        let (kind, title, icon, phrase) = match b.status.as_str() {
            "new" => ("info", "Booking request received", "fa-paper-plane", "has been received. A travel advisor will be assigned shortly"),
            "assigned" => ("info", "A travel advisor is on your request", "fa-user-tie", "has been assigned to a travel advisor"),
            "contacted" => ("info", "Your advisor has been in touch", "fa-comments", "is in progress with your advisor"),
            "awaiting_approval" => ("info", "Your quotation is ready", "fa-file-lines", "has a quotation ready for your review"),
            "awaiting_payment" => ("info", "Awaiting payment", "fa-clock", "is awaiting payment"),
            "payment_received" => ("success", "Payment received", "fa-check", "payment has been received"),
            "booking_confirmed" => ("success", "Booking confirmed", "fa-check-circle", "is confirmed"),
            "completed" => ("success", "Trip completed", "fa-flag-checkered", "is completed"),
            "cancelled" => ("warning", "Booking cancelled", "fa-times-circle", "was cancelled"),
            _ => ("info", "Booking update", "fa-clock", "was updated"),
        };
        let link = if b.status == "awaiting_approval" {
            format!("/bookings/{}/quote", b.id)
        } else {
            format!("/bookings/{}", b.id)
        };
        items.push(NotificationDTO {
            id: format!("booking-{}", b.id),
            kind: kind.to_string(),
            category: "bookings".to_string(),
            title: title.to_string(),
            message: format!(
                "Your {} booking {} {}.",
                humanize(&b.booking_type).to_lowercase(),
                b.display_code,
                phrase
            ),
            icon: icon.to_string(),
            amount: None,
            link: Some(link),
            created_at: b.updated_at,
            read: is_read(b.updated_at),
        });
    }

    // Replies from the member's advisor (most recent per booking, last 30 days).
    let replies: Vec<(Uuid, String, String, String, DateTime<Utc>)> = sqlx::query_as(
        r#"SELECT DISTINCT ON (m.booking_id) m.booking_id, b.display_code, TRIM(u.first_name), m.body, m.created_at
           FROM booking_messages m
           JOIN bookings b ON b.id = m.booking_id
           JOIN users u ON u.id = m.sender_id
           WHERE b.user_id = $1 AND m.sender_role = 'staff' AND m.created_at > NOW() - INTERVAL '30 days'
           ORDER BY m.booking_id, m.created_at DESC"#,
    )
    .bind(claims.sub)
    .fetch_all(pool.get_ref())
    .await?;
    for (booking_id, code, advisor, body, at) in replies {
        items.push(NotificationDTO {
            id: format!("message-{booking_id}-{}", at.timestamp()),
            kind: "info".to_string(),
            category: "bookings".to_string(),
            title: format!("{advisor} replied on {code}"),
            message: body.chars().take(140).collect(),
            icon: "fa-comments".to_string(),
            amount: None,
            link: Some(format!("/bookings/{booking_id}")),
            created_at: at,
            read: is_read(at),
        });
    }

    if wings_on {
        for r in &rewards {
            if r.points == 0 {
                continue;
            }
            // Redemptions get their own richer entries below.
            if matches!(r.source_type.as_deref(), Some("redemption") | Some("redemption_refund")) {
                continue;
            }
            let earned = r.points > 0;
            let message = r.description.clone().unwrap_or_else(|| {
                if earned {
                    format!("You earned {} Wings ({}).", r.points, humanize(&r.reason))
                } else {
                    format!("{} Wings were deducted ({}).", r.points.abs(), humanize(&r.reason))
                }
            });
            items.push(NotificationDTO {
                id: format!("reward-{}", r.id),
                kind: "success".to_string(),
                category: "wings".to_string(),
                title: reward_title(&r.reason, earned).to_string(),
                message,
                icon: if r.reason == "referral" { "fa-user-group" } else { "fa-coins" }.to_string(),
                amount: Some(r.points),
                link: Some("/rewards".to_string()),
                created_at: r.created_at,
                read: is_read(r.created_at),
            });
        }
    }

    if rewards_on {
        let redemptions: Vec<(Uuid, String, String, i32, String, DateTime<Utc>)> = sqlx::query_as(
            "SELECT id, display_code, item_name, wings_cost, status, updated_at FROM redemptions WHERE user_id = $1",
        )
        .bind(claims.sub)
        .fetch_all(pool.get_ref())
        .await?;
        for (id, code, name, cost, status, updated_at) in redemptions {
            let (kind, title, msg, amount) = match status.as_str() {
                "requested" => ("info", "Redemption submitted", format!("{name} ({code}) is awaiting staff approval. {cost} Wings are reserved."), Some(-cost)),
                "approved" => ("info", "Redemption approved", format!("{name} ({code}) was approved and your voucher is being prepared."), None),
                "voucher_issued" | "delivered" => ("success", "Your reward is ready", format!("Your voucher for {name} ({code}) is ready to use."), None),
                "rejected" => ("warning", "Redemption declined", format!("{name} ({code}) was not approved. {cost} Wings were refunded."), Some(cost)),
                _ => ("warning", "Redemption cancelled", format!("{name} ({code}) was cancelled. {cost} Wings were refunded."), Some(cost)),
            };
            items.push(NotificationDTO {
                id: format!("redemption-{id}"),
                kind: kind.to_string(),
                category: "wings".to_string(),
                title: title.to_string(),
                message: msg,
                icon: "fa-gift".to_string(),
                amount,
                link: Some(format!("/rewards/redemptions/{id}")),
                created_at: updated_at,
                read: is_read(updated_at),
            });
        }
    }

    items.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    items.truncate(40);
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
