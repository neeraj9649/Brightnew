use actix_web::web::{self, ServiceConfig};
use chrono::{DateTime, Datelike, NaiveDate, Utc};
use serde::Serialize;
use sqlx::PgPool;

use base::error::{ApiError, ApiResponse};

#[derive(Debug, Serialize)]
pub struct PublicCardDTO {
    pub membership_code: String,
    pub name: String,
    pub membership_tier: String,
    pub member_since: DateTime<Utc>,
    pub valid_until: NaiveDate,
}

/// Cards stay valid through the end of the next calendar year.
pub fn card_valid_until() -> NaiveDate {
    NaiveDate::from_ymd_opt(Utc::now().year() + 1, 12, 31).expect("valid calendar date")
}

/// Public (NO auth) membership-card lookup by code. This is what the card QR
/// points to, so anyone scanning the card sees the member's card info.
async fn public_card_handler(
    pool: web::Data<PgPool>,
    code: web::Path<String>,
) -> Result<ApiResponse<PublicCardDTO>, ApiError> {
    let code = code.into_inner();
    let row = sqlx::query!(
        r#"SELECT first_name, last_name, membership_tier, membership_code,
                  joined_at
           FROM users WHERE membership_code = $1"#,
        code
    )
    .fetch_optional(pool.get_ref())
    .await
    .map_err(|e| ApiError::new(e.to_string(), 500))?;

    match row {
        Some(r) => Ok(ApiResponse(PublicCardDTO {
            membership_code: r.membership_code,
            name: format!("{} {}", r.first_name, r.last_name.unwrap_or_default())
                .trim()
                .to_string(),
            membership_tier: r.membership_tier,
            member_since: r.joined_at,
            valid_until: card_valid_until(),
        })),
        None => Err(ApiError::new("Card not found", 404)),
    }
}

pub fn cards_routes(cfg: &mut ServiceConfig) {
    cfg.service(web::scope("/cards").route("/{code}", web::get().to(public_card_handler)));
}
