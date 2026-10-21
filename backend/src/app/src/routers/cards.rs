use actix_web::web::{self, ServiceConfig};
use chrono::{DateTime, Months, NaiveDate, Utc};
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

/// A card is valid for one year from the day the membership was created.
pub fn card_valid_until(joined_at: DateTime<Utc>) -> NaiveDate {
    let created = joined_at.date_naive();
    created.checked_add_months(Months::new(12)).unwrap_or(created)
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
            valid_until: card_valid_until(r.joined_at),
        })),
        None => Err(ApiError::new("Card not found", 404)),
    }
}

pub fn cards_routes(cfg: &mut ServiceConfig) {
    cfg.service(web::scope("/cards").route("/{code}", web::get().to(public_card_handler)));
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    #[test]
    fn card_is_valid_for_one_year_from_creation() {
        let day = |y, m, d| Utc.with_ymd_and_hms(y, m, d, 10, 30, 0).unwrap();
        assert_eq!(card_valid_until(day(2026, 10, 20)), NaiveDate::from_ymd_opt(2027, 10, 20).unwrap());
        assert_eq!(card_valid_until(day(2027, 1, 1)), NaiveDate::from_ymd_opt(2028, 1, 1).unwrap());
        // 29 February rolls to the last day of February the next year.
        assert_eq!(card_valid_until(day(2028, 2, 29)), NaiveDate::from_ymd_opt(2029, 2, 28).unwrap());
    }
}
