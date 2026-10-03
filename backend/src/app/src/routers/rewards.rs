use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};

use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use base::role::{ADMIN_ONLY, STAFF};
use rewards::api::controllers::reward_handler::{
    admin_award_points_handler, admin_user_reward_history_handler,
    my_reward_history_handler, points_config_handler,
    update_points_config_handler,
};

pub fn rewards_routes(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/rewards")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, &[]).await
            }))
            .route("/me", web::get().to(my_reward_history_handler))
            .route("/points-config", web::get().to(points_config_handler)),
    )
    .service(
        web::scope("/admin/rewards")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, STAFF).await
            }))
            .route("/award", web::post().to(admin_award_points_handler))
            .route(
                "/users/{id}",
                web::get().to(admin_user_reward_history_handler),
            ),
    )
    .service(
        web::scope("/admin/points-config")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, ADMIN_ONLY).await
            }))
            .route("", web::put().to(update_points_config_handler)),
    );
}
