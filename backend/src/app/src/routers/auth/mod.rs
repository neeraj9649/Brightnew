use actix_web::web::ServiceConfig;

use auth_endpoints::auth_endpoints_config;
use user::user_config;

mod auth_endpoints;
mod user;

pub fn auth_routes(cfg: &mut ServiceConfig) {
    auth_endpoints_config(cfg);
    user_config(cfg);
}
