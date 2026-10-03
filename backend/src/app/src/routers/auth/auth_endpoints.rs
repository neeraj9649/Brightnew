use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};

use auth::api::controllers::auth_handler::{
    get_me_handler, login_handler, logout_handler, refresh_token_handler,
    register_handler,
};
use auth::api::middlewares::jwt_extractor::check_permission_middleware;

pub fn auth_endpoints_config(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/auth")
            .route("/register", web::post().to(register_handler))
            .route("/login", web::post().to(login_handler))
            .route("/refresh", web::post().to(refresh_token_handler))
            .route("/logout", web::post().to(logout_handler))
            .service(
                web::resource("/me")
                    .wrap(from_fn(|req, next| async move {
                        check_permission_middleware(req, next, &[]).await
                    }))
                    .route(web::get().to(get_me_handler)),
            ),
    );
}
