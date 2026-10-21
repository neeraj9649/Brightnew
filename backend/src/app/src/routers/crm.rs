use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};

use sqlx::PgPool;
use uuid::Uuid;

use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use base::error::{internal, ApiError, ApiResponse};
use base::jwt_claims::JwtClaims;
use base::role::{self, STAFF};
use crm::api::controllers::document_handler as documents;
use crm::api::controllers::expense_handler as expenses;
use crm::api::controllers::note_handler as notes;
use crm::api::controllers::quotation_handler as quotations;
use crm::api::controllers::task_handler::{self as tasks, list_my_tasks_handler};
use crm::api::dto::document::{BookingDocumentDTO, CreateBookingDocumentDTO};
use crm::api::dto::expense::{BookingExpenseDTO, CreateBookingExpenseDTO};
use crm::api::dto::note::{CreateNoteDTO, NoteDTO};
use crm::api::dto::quotation::{CreateQuotationDTO, QuotationDTO};
use crm::api::dto::task::{CreateTaskDTO, TaskDTO};
use crm::domain::services::document::BookingDocumentService;
use crm::domain::services::expense::BookingExpenseService;
use crm::domain::services::note::BookingNoteService;
use crm::domain::services::quotation::QuotationService;
use crm::domain::services::task::TaskService;

use super::portal::ensure_staff_access;

// The CRM handlers only know about ids, so each route below first checks that the
// caller may work the booking (admins: any; employees: the ones assigned to them) --
// the same rule the portal's staff routes already apply.

/// Booking a row belongs to, looked up by the row's id in `table`.
async fn booking_of(pool: &PgPool, table: &'static str, id: Uuid) -> Result<Option<Uuid>, ApiError> {
    // `table` is always one of the literals below, never user input.
    let sql = format!("SELECT booking_id FROM {table} WHERE id = $1");
    let row: Option<(Uuid,)> = sqlx::query_as(&sql).bind(id).fetch_optional(pool).await.map_err(internal)?;
    row.map(|(booking_id,)| Some(booking_id)).ok_or_else(|| ApiError::new("Not found", 404))
}

async fn ensure_row_access(pool: &PgPool, claims: &JwtClaims, table: &'static str, id: Uuid) -> Result<(), ApiError> {
    match booking_of(pool, table, id).await? {
        Some(booking_id) => ensure_staff_access(pool, claims, booking_id).await,
        None => Ok(()),
    }
}

async fn create_note(
    pool: web::Data<PgPool>, svc: web::Data<dyn BookingNoteService>, claims: JwtClaims, body: web::Json<CreateNoteDTO>,
) -> Result<ApiResponse<NoteDTO>, ApiError> {
    ensure_staff_access(&pool, &claims, body.booking_id).await?;
    notes::create_note_handler(svc, claims, body).await
}

async fn list_notes(
    pool: web::Data<PgPool>, svc: web::Data<dyn BookingNoteService>, claims: JwtClaims, path: web::Path<Uuid>,
) -> Result<ApiResponse<Vec<NoteDTO>>, ApiError> {
    ensure_staff_access(&pool, &claims, *path).await?;
    notes::list_notes_handler(svc, path).await
}

async fn create_quotation(
    pool: web::Data<PgPool>, svc: web::Data<dyn QuotationService>, claims: JwtClaims, body: web::Json<CreateQuotationDTO>,
) -> Result<ApiResponse<QuotationDTO>, ApiError> {
    ensure_staff_access(&pool, &claims, body.booking_id).await?;
    quotations::create_quotation_handler(svc, claims, body).await
}

async fn list_quotations(
    pool: web::Data<PgPool>, svc: web::Data<dyn QuotationService>, claims: JwtClaims, path: web::Path<Uuid>,
) -> Result<ApiResponse<Vec<QuotationDTO>>, ApiError> {
    ensure_staff_access(&pool, &claims, *path).await?;
    quotations::list_quotations_handler(svc, path).await
}

async fn create_task(
    pool: web::Data<PgPool>, svc: web::Data<dyn TaskService>, claims: JwtClaims, body: web::Json<CreateTaskDTO>,
) -> Result<ApiResponse<TaskDTO>, ApiError> {
    if let Some(booking_id) = body.booking_id {
        ensure_staff_access(&pool, &claims, booking_id).await?;
    }
    tasks::create_task_handler(svc, claims, body).await
}

async fn list_tasks_for_booking(
    pool: web::Data<PgPool>, svc: web::Data<dyn TaskService>, claims: JwtClaims, path: web::Path<Uuid>,
) -> Result<ApiResponse<Vec<TaskDTO>>, ApiError> {
    ensure_staff_access(&pool, &claims, *path).await?;
    tasks::list_tasks_for_booking_handler(svc, path).await
}

/// A task is changeable by whoever may work its booking; a task with no booking
/// belongs to its assignee (admins may change any).
async fn ensure_task_access(pool: &PgPool, claims: &JwtClaims, task_id: Uuid) -> Result<(), ApiError> {
    let row: Option<(Option<Uuid>, Uuid)> =
        sqlx::query_as("SELECT booking_id, assigned_to FROM tasks WHERE id = $1")
            .bind(task_id)
            .fetch_optional(pool)
            .await
            .map_err(internal)?;
    match row {
        None => Err(ApiError::new("Task not found", 404)),
        Some((Some(booking_id), _)) => ensure_staff_access(pool, claims, booking_id).await,
        Some((None, assignee)) if role::is_admin(&claims.role) || assignee == claims.sub => Ok(()),
        Some(_) => Err(ApiError::new("This task is not assigned to you", 403)),
    }
}

async fn complete_task(
    pool: web::Data<PgPool>, svc: web::Data<dyn TaskService>, claims: JwtClaims, path: web::Path<Uuid>,
) -> Result<ApiResponse<TaskDTO>, ApiError> {
    ensure_task_access(&pool, &claims, *path).await?;
    tasks::complete_task_handler(svc, path).await
}

async fn cancel_task(
    pool: web::Data<PgPool>, svc: web::Data<dyn TaskService>, claims: JwtClaims, path: web::Path<Uuid>,
) -> Result<ApiResponse<TaskDTO>, ApiError> {
    ensure_task_access(&pool, &claims, *path).await?;
    tasks::cancel_task_handler(svc, path).await
}

async fn create_expense(
    pool: web::Data<PgPool>, svc: web::Data<dyn BookingExpenseService>, claims: JwtClaims, body: web::Json<CreateBookingExpenseDTO>,
) -> Result<ApiResponse<BookingExpenseDTO>, ApiError> {
    ensure_staff_access(&pool, &claims, body.booking_id).await?;
    expenses::create_expense_handler(svc, claims, body).await
}

async fn list_expenses(
    pool: web::Data<PgPool>, svc: web::Data<dyn BookingExpenseService>, claims: JwtClaims, path: web::Path<Uuid>,
) -> Result<ApiResponse<Vec<BookingExpenseDTO>>, ApiError> {
    ensure_staff_access(&pool, &claims, *path).await?;
    expenses::list_expenses_handler(svc, path).await
}

async fn delete_expense(
    pool: web::Data<PgPool>, svc: web::Data<dyn BookingExpenseService>, claims: JwtClaims, path: web::Path<Uuid>,
) -> Result<ApiResponse<Uuid>, ApiError> {
    ensure_row_access(&pool, &claims, "booking_expenses", *path).await?;
    expenses::delete_expense_handler(svc, path).await
}

async fn create_document(
    pool: web::Data<PgPool>, svc: web::Data<dyn BookingDocumentService>, claims: JwtClaims, body: web::Json<CreateBookingDocumentDTO>,
) -> Result<ApiResponse<BookingDocumentDTO>, ApiError> {
    ensure_staff_access(&pool, &claims, body.booking_id).await?;
    documents::create_document_handler(svc, claims, body).await
}

async fn list_documents(
    pool: web::Data<PgPool>, svc: web::Data<dyn BookingDocumentService>, claims: JwtClaims, path: web::Path<Uuid>,
) -> Result<ApiResponse<Vec<BookingDocumentDTO>>, ApiError> {
    ensure_staff_access(&pool, &claims, *path).await?;
    documents::list_documents_handler(svc, path).await
}

async fn delete_document(
    pool: web::Data<PgPool>, svc: web::Data<dyn BookingDocumentService>, claims: JwtClaims, path: web::Path<Uuid>,
) -> Result<ApiResponse<Uuid>, ApiError> {
    ensure_row_access(&pool, &claims, "booking_documents", *path).await?;
    documents::delete_document_handler(svc, path).await
}

pub fn crm_routes(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/crm")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, STAFF).await
            }))
            .route("/notes", web::post().to(create_note))
            .route(
                "/bookings/{id}/notes",
                web::get().to(list_notes),
            )
            .route("/quotations", web::post().to(create_quotation))
            .route(
                "/bookings/{id}/quotations",
                web::get().to(list_quotations),
            )
            .route("/tasks", web::post().to(create_task))
            .route("/tasks/me", web::get().to(list_my_tasks_handler))
            .route(
                "/bookings/{id}/tasks",
                web::get().to(list_tasks_for_booking),
            )
            .route(
                "/tasks/{id}/complete",
                web::patch().to(complete_task),
            )
            .route("/tasks/{id}/cancel", web::patch().to(cancel_task))
            // Per-booking expenses (= schedule legs + PnL cost lines).
            .route("/expenses", web::post().to(create_expense))
            .route(
                "/bookings/{id}/expenses",
                web::get().to(list_expenses),
            )
            .route("/expenses/{id}", web::delete().to(delete_expense))
            // Per-booking documents (tickets/vouchers/invoices/quotations).
            .route("/documents", web::post().to(create_document))
            .route(
                "/bookings/{id}/documents",
                web::get().to(list_documents),
            )
            .route(
                "/documents/{id}",
                web::delete().to(delete_document),
            ),
    );
}
