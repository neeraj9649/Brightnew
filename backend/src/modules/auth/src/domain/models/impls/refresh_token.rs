use chrono::{Duration, Utc};
use uuid::Uuid;

use crate::domain::models::refresh_token::CreateRefreshToken;
use base::constants;

impl CreateRefreshToken {
    pub fn new(user_id: Uuid, token_hash: String) -> Self {
        let iat = Utc::now();
        let exp = iat + Duration::days(*constants::REFRESH_TOKEN_EXP_DAYS);
        Self {
            user_id,
            token_hash,
            family_id: Uuid::new_v4(),
            issued_at: iat,
            expires_at: exp,
        }
    }
}
