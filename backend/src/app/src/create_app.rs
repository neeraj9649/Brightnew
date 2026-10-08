use crate::container::Container;
use crate::routers::{
    admin_portal, analytics, auth, bookings, cards, crm, financials, health, loyalty,
    notifications, portal, redemptions, referral, rewards, support, uploads,
};
use actix_cors::Cors;
use actix_web::body::MessageBody;
use actix_web::dev::{ServiceFactory, ServiceRequest, ServiceResponse};
use actix_web::{web, App, Error};
use base::constants;
use base::log_config::log_format_config;
use std::sync::Arc;

pub fn create_app(
    container: Arc<Container>,
) -> App<
    impl ServiceFactory<
        ServiceRequest,
        Response = ServiceResponse<impl MessageBody>,
        Config = (),
        InitError = (),
        Error = Error,
    >,
> {
    let user_service = container.user_service.clone();
    let refresh_token_service = container.refresh_token_service.clone();
    let booking_service = container.booking_service.clone();
    let rewards_service = container.rewards_service.clone();
    let referral_service = container.referral_service.clone();
    let note_service = container.note_service.clone();
    let quotation_service = container.quotation_service.clone();
    let task_service = container.task_service.clone();
    let expense_service = container.expense_service.clone();
    let document_service = container.document_service.clone();
    let analytics_service = container.analytics_service.clone();
    let sqlx_pool = container.sqlx_pool.clone();

    let logger = log_format_config();
    // ponytail: comma-separated origins so gotur (:3000) + BrightP (:3001) both work.
    let cors = {
        let mut cors = Cors::default()
            .allow_any_method()
            .allow_any_header()
            .supports_credentials()
            .max_age(3600);
        for origin in constants::CORS_ALLOWED_ORIGIN.split(',') {
            let origin = origin.trim();
            if !origin.is_empty() {
                cors = cors.allowed_origin(origin);
            }
        }
        cors
    };
    App::new()
        .service(health::health)
        .app_data(web::Data::from(user_service))
        .app_data(web::Data::from(refresh_token_service))
        .app_data(web::Data::from(booking_service))
        .app_data(web::Data::from(rewards_service))
        .app_data(web::Data::from(referral_service))
        .app_data(web::Data::from(note_service))
        .app_data(web::Data::from(quotation_service))
        .app_data(web::Data::from(task_service))
        .app_data(web::Data::from(expense_service))
        .app_data(web::Data::from(document_service))
        .app_data(web::Data::from(analytics_service))
        .app_data(web::Data::new(sqlx_pool))
        .wrap(logger)
        // .wrap(cors)
        .configure(auth::auth_routes)
        .configure(bookings::bookings_routes)
        .configure(rewards::rewards_routes)
        .configure(loyalty::loyalty_routes)
        .configure(notifications::notifications_routes)
        .configure(redemptions::redemption_routes)
        .configure(cards::cards_routes)
        .configure(referral::referral_routes)
        .configure(crm::crm_routes)
        .configure(financials::financials_routes)
        .configure(analytics::analytics_routes)
        .configure(uploads::uploads_routes)
        .configure(support::support_routes)
        .configure(portal::portal_routes)
        .configure(admin_portal::admin_portal_routes)
}
