use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};

use analytics::api::controllers::handler::{
    customers_handler, employees_handler, membership_handler, overview_handler,
    referral_handler, revenue_handler,
};
use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use base::role::ADMIN_ONLY;

pub fn analytics_routes(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/admin/analytics")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, ADMIN_ONLY).await
            }))
            .route("/overview", web::get().to(overview_handler))
            .route("/revenue", web::get().to(revenue_handler))
            .route("/customers", web::get().to(customers_handler))
            .route("/membership", web::get().to(membership_handler))
            .route("/referral", web::get().to(referral_handler))
            .route("/employees", web::get().to(employees_handler)),
    );
}
