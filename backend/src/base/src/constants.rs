use lazy_static::lazy_static;
use std::env;

lazy_static! {
    pub static ref DATABASE_URL: String = set_db_url();
    pub static ref ADDRESS: String = set_address();
    pub static ref PORT: u16 = set_port();
    pub static ref PASSWORD_HASH_SECRET: String = set_password_hash_secret();
    pub static ref JWT_SECRET: String = set_jwt_secret();
    pub static ref REFRESH_TOKEN_COOKIE_NAME: String =
        set_refresh_token_cookie_name();
    pub static ref REFRESH_TOKEN_SECRET: String = set_refresh_token_secret();
    pub static ref REFRESH_TOKEN_EXP_DAYS: i64 = set_refresh_token_exp_days();
    pub static ref JWT_TOKEN_EXP_MINUTES: i64 = set_jwt_token_exp_minutes();
    pub static ref CORS_ALLOWED_ORIGIN: String = set_cors_allowed_origin();
}

fn set_cors_allowed_origin() -> String {
    dotenv::dotenv().ok();
    env::var("CORS_ALLOWED_ORIGIN")
        .unwrap_or_else(|_| "http://localhost:3000".to_string())
}

fn set_address() -> String {
    dotenv::dotenv().ok();
    env::var("ADDRESS").unwrap_or_else(|_| "0.0.0.0".to_string())
}

fn set_port() -> u16 {
    dotenv::dotenv().ok();
    env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse::<u16>()
        .expect("Can't parse the port")
}

fn set_db_url() -> String {
    dotenv::dotenv().ok();
    env::var("DATABASE_URL").expect("DATABASE_URL not found in env")
}

fn set_jwt_secret() -> String {
    dotenv::dotenv().ok();
    env::var("JWT_SECRET").expect("JWT_SECRET not found in env")
}

fn set_refresh_token_secret() -> String {
    dotenv::dotenv().ok();
    env::var("REFRESH_TOKEN_SECRET")
        .expect("REFRESH_TOKEN_SECRET not found in env")
}

fn set_password_hash_secret() -> String {
    dotenv::dotenv().ok();
    env::var("PASSWORD_HASH_SECRET")
        .expect("PASSWORD_HASH_SECRET not found in env")
}

fn set_refresh_token_cookie_name() -> String {
    dotenv::dotenv().ok();
    env::var("REFRESH_TOKEN_COOKIE_NAME")
        .unwrap_or_else(|_| "refresh_token".to_string())
}

fn set_refresh_token_exp_days() -> i64 {
    dotenv::dotenv().ok();
    env::var("REFRESH_TOKEN_EXP_DAYS")
        .unwrap_or_else(|_| "30".to_string())
        .parse::<i64>()
        .expect("can't parse REFRESH_TOKEN_EXP_DAYS")
}

fn set_jwt_token_exp_minutes() -> i64 {
    dotenv::dotenv().ok();
    env::var("JWT_TOKEN_EXP_MINUTES")
        .unwrap_or_else(|_| "15".to_string())
        .parse::<i64>()
        .expect("can't parse JWT_TOKEN_EXP_MINUTES")
}
