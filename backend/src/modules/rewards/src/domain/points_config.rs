//! Reward point amounts, DB-backed and admin-editable (table `points_config`,
//! one row per key). Keys are the 10 booking types + `welcome_bonus` +
//! `first_booking`. Every read falls back to 100 if a row/table is missing so
//! the award path never fails on a config lookup.
use std::collections::HashMap;

use sqlx::PgPool;

/// The reward service keys the admin can configure (seeded in migration 0017).
/// Real booking types (flight/hotel/tour/visa) plus forward-looking / manual
/// categories (holiday_package, office_visit, referral_booking, ...). Used to
/// enumerate the editor rows and to filter writes to known keys.
pub const BOOKING_TYPES: [&str; 10] = [
    "flight", "visa", "tour", "hotel", "airport_transfer", "cruise", "insurance",
    "activity", "car_rental", "custom",
];

const WELCOME_BONUS_KEY: &str = "welcome_bonus";
const FIRST_BOOKING_KEY: &str = "first_booking";
const DEFAULT_POINTS: i32 = 100;

/// Snapshot of every configured amount, in a UI-friendly shape.
pub struct PointsConfig {
    pub welcome_bonus: i32,
    pub first_booking: i32,
    /// `(booking_type, points)` for all `BOOKING_TYPES`, in declared order.
    pub services: Vec<(String, i32)>,
}

async fn get_points(pool: &PgPool, key: &str) -> i32 {
    sqlx::query_scalar!("SELECT points FROM points_config WHERE key = $1", key)
        .fetch_optional(pool)
        .await
        .ok()
        .flatten()
        .unwrap_or(DEFAULT_POINTS)
}

pub async fn welcome_bonus_points(pool: &PgPool) -> i32 {
    get_points(pool, WELCOME_BONUS_KEY).await
}

pub async fn first_booking_bonus_points(pool: &PgPool) -> i32 {
    get_points(pool, FIRST_BOOKING_KEY).await
}

pub async fn points_for_booking_type(pool: &PgPool, booking_type: &str) -> i32 {
    get_points(pool, booking_type).await
}

/// All amounts at once, for the read endpoint and the admin editor.
pub async fn read_config(pool: &PgPool) -> PointsConfig {
    let map: HashMap<String, i32> =
        sqlx::query!("SELECT key, points FROM points_config")
            .fetch_all(pool)
            .await
            .map(|rows| rows.into_iter().map(|r| (r.key, r.points)).collect())
            .unwrap_or_default();
    let get = |k: &str| map.get(k).copied().unwrap_or(DEFAULT_POINTS);
    PointsConfig {
        welcome_bonus: get(WELCOME_BONUS_KEY),
        first_booking: get(FIRST_BOOKING_KEY),
        services: BOOKING_TYPES.iter().map(|t| (t.to_string(), get(t))).collect(),
    }
}

/// Upsert the editable amounts (admin only). Unknown service keys are ignored;
/// negative values are rejected by the table CHECK constraint.
pub async fn write_config(
    pool: &PgPool,
    welcome_bonus: i32,
    first_booking: i32,
    services: &[(String, i32)],
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;
    for (key, points) in
        std::iter::once((WELCOME_BONUS_KEY.to_string(), welcome_bonus))
            .chain(std::iter::once((FIRST_BOOKING_KEY.to_string(), first_booking)))
            .chain(
                services
                    .iter()
                    .filter(|(t, _)| BOOKING_TYPES.contains(&t.as_str()))
                    .cloned(),
            )
    {
        sqlx::query!(
            "INSERT INTO points_config (key, points) VALUES ($1, $2)
             ON CONFLICT (key) DO UPDATE SET points = EXCLUDED.points",
            key,
            points
        )
        .execute(&mut *tx)
        .await?;
    }
    tx.commit().await
}
