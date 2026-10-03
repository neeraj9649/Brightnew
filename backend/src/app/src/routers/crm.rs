use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};

use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use base::role::STAFF;
use crm::api::controllers::document_handler::{
    create_document_handler, delete_document_handler, list_documents_handler,
};
use crm::api::controllers::expense_handler::{
    create_expense_handler, delete_expense_handler, list_expenses_handler,
};
use crm::api::controllers::note_handler::{create_note_handler, list_notes_handler};
use crm::api::controllers::quotation_handler::{
    create_quotation_handler, list_quotations_handler,
};
use crm::api::controllers::task_handler::{
    cancel_task_handler, complete_task_handler, create_task_handler,
    list_my_tasks_handler, list_tasks_for_booking_handler,
};

pub fn crm_routes(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/crm")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, STAFF).await
            }))
            .route("/notes", web::post().to(create_note_handler))
            .route(
                "/bookings/{id}/notes",
                web::get().to(list_notes_handler),
            )
            .route("/quotations", web::post().to(create_quotation_handler))
            .route(
                "/bookings/{id}/quotations",
                web::get().to(list_quotations_handler),
            )
            .route("/tasks", web::post().to(create_task_handler))
            .route("/tasks/me", web::get().to(list_my_tasks_handler))
            .route(
                "/bookings/{id}/tasks",
                web::get().to(list_tasks_for_booking_handler),
            )
            .route(
                "/tasks/{id}/complete",
                web::patch().to(complete_task_handler),
            )
            .route("/tasks/{id}/cancel", web::patch().to(cancel_task_handler))
            // Per-booking expenses (= schedule legs + PnL cost lines).
            .route("/expenses", web::post().to(create_expense_handler))
            .route(
                "/bookings/{id}/expenses",
                web::get().to(list_expenses_handler),
            )
            .route("/expenses/{id}", web::delete().to(delete_expense_handler))
            // Per-booking documents (tickets/vouchers/invoices/quotations).
            .route("/documents", web::post().to(create_document_handler))
            .route(
                "/bookings/{id}/documents",
                web::get().to(list_documents_handler),
            )
            .route(
                "/documents/{id}",
                web::delete().to(delete_document_handler),
            ),
    );
}
