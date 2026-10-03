use actix_web::{FromRequest, HttpMessage};
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::constants;

#[derive(Serialize, Deserialize)]
pub struct JwtClaims {
    pub sub: Uuid,
    pub role: String,
    pub exp: usize,
    pub iat: usize,
}

impl JwtClaims {
    pub fn new(user_id: Uuid, role: String) -> Self {
        let iat = Utc::now();
        let exp = iat + Duration::minutes(*constants::JWT_TOKEN_EXP_MINUTES);
        Self {
            sub: user_id,
            role,
            exp: exp.timestamp() as usize,
            iat: iat.timestamp() as usize,
        }
    }
}

impl FromRequest for JwtClaims {
    type Error = actix_web::Error;
    type Future = futures_util::future::Ready<Result<Self, Self::Error>>;

    fn from_request(
        req: &actix_web::HttpRequest,
        _: &mut actix_web::dev::Payload,
    ) -> Self::Future {
        if let Some(claims) = req.extensions().get::<JwtClaims>() {
            futures_util::future::ready(Ok(claims.clone()))
        } else {
            futures_util::future::ready(Err(
                actix_web::error::ErrorUnauthorized("Missing or invalid JWT"),
            ))
        }
    }
}

impl Clone for JwtClaims {
    fn clone(&self) -> Self {
        Self {
            sub: self.sub,
            role: self.role.clone(),
            exp: self.exp,
            iat: self.iat,
        }
    }
}
