use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct RefreshToken {
    pub id: Uuid,
    pub user_id: Uuid,
    pub token_hash: String,
    pub family_id: Uuid,
    pub issued_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
    pub is_revoked: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub struct CreateRefreshToken {
    pub user_id: Uuid,
    pub token_hash: String,
    pub family_id: Uuid,
    pub issued_at: DateTime<Utc>,
    pub expires_at: DateTime<Utc>,
}

/// What happened when a refresh token was presented to be swapped for a new one.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Rotation {
    /// The token was valid; it is now revoked and a new one was stored.
    Rotated { user_id: Uuid, family_id: Uuid },
    /// The token was swapped for a new one moments ago (two requests at once, e.g. two tabs).
    /// The sign-in is still good, but no new token is handed out.
    Duplicate { user_id: Uuid, family_id: Uuid },
    /// Unknown token.
    NotFound,
    /// Expired token; its sign-in was ended.
    Expired,
    /// An already-used token came back after the grace period: treated as theft, sign-in ended.
    Reused,
}

/// Result of renewing a session with a refresh token.
#[derive(Debug, Clone)]
pub struct RenewedSession {
    pub user_id: Uuid,
    pub family_id: Uuid,
    /// The replacement refresh token; `None` for a harmless duplicate request.
    pub new_raw_token: Option<String>,
}
