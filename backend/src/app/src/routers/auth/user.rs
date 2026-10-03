use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};

use auth::api::controllers::user_handler::{
    admin_create_user_handler, admin_update_user_handler, change_pin_handler,
    get_me_profile_handler, list_users_handler, staff_get_user_handler,
    update_me_profile_handler,
};
use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use base::role::{ADMIN_ONLY, STAFF};

pub fn user_config(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/users/me")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, &[]).await
            }))
            .route("", web::get().to(get_me_profile_handler))
            .route("", web::patch().to(update_me_profile_handler))
            .route("/pin", web::patch().to(change_pin_handler)),
    )
    .service(
        web::scope("/admin/users")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, ADMIN_ONLY).await
            }))
            .route("", web::get().to(list_users_handler))
            .route("", web::post().to(admin_create_user_handler))
            .route("", web::patch().to(admin_update_user_handler)),
    )
    // Front-desk employees can sign up a walk-in customer (create only).
    // Listing/role changes stay admin-only above; the created account always
    // defaults to a plain customer regardless of who creates it.
    .service(
        web::scope("/staff/users")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, STAFF).await
            }))
            .route("", web::post().to(admin_create_user_handler))
            .route("/{id}", web::get().to(staff_get_user_handler)),
    );
}
