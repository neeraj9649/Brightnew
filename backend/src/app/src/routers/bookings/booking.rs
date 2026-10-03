use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};
use uuid::Uuid;

use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use base::error::{ApiError, ApiResponse};
use base::jwt_claims::JwtClaims;
use base::role::STAFF;
use bookings::api::controllers::booking_handler::{
    admin_list_bookings_handler, admin_update_booking_handler,
    cancel_booking_handler, create_booking_handler, get_booking_handler,
    list_my_bookings_handler, staff_create_booking_handler,
};
use crm::api::dto::document::BookingDocumentDTO;
use crm::domain::services::document::BookingDocumentService;

/// Customer-facing: download links for the documents on one's own booking
/// (tickets/vouchers/invoices only). Ownership enforced in the query.
async fn list_my_booking_documents_handler(
    document_service: web::Data<dyn BookingDocumentService>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<Vec<BookingDocumentDTO>>, ApiError> {
    let docs = document_service
        .list_customer_visible(path.into_inner(), claims.sub)
        .await?;
    Ok(ApiResponse(docs.into_iter().map(Into::into).collect()))
}

pub fn booking_config(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/bookings")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, &[]).await
            }))
            .service(
                web::resource("")
                    .route(web::post().to(create_booking_handler))
                    .route(web::get().to(list_my_bookings_handler)),
            )
            .service(
                web::resource("/{id}").route(web::get().to(get_booking_handler)),
            )
            .service(
                web::resource("/{id}/documents")
                    .route(web::get().to(list_my_booking_documents_handler)),
            )
            .service(
                web::resource("/{id}/cancel")
                    .route(web::post().to(cancel_booking_handler)),
            ),
    )
    .service(
        web::scope("/admin/bookings")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, STAFF).await
            }))
            .route("", web::get().to(admin_list_bookings_handler))
            .route("", web::patch().to(admin_update_booking_handler))
            .route("", web::post().to(staff_create_booking_handler)),
    );
}
