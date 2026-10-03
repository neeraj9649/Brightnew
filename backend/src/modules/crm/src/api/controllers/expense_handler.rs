use actix_web::web;
use bigdecimal::BigDecimal;
use std::str::FromStr;

use base::error::{ApiError, ApiResponse};
use base::jwt_claims::JwtClaims;
use uuid::Uuid;

use crate::api::dto::expense::{BookingExpenseDTO, CreateBookingExpenseDTO};
use crate::domain::models::expense::CreateBookingExpense;
use crate::domain::services::expense::BookingExpenseService;

pub async fn create_expense_handler(
    expense_service: web::Data<dyn BookingExpenseService>,
    claims: JwtClaims,
    body: web::Json<CreateBookingExpenseDTO>,
) -> Result<ApiResponse<BookingExpenseDTO>, ApiError> {
    let b = body.into_inner();
    let expense = expense_service
        .add(CreateBookingExpense {
            booking_id: b.booking_id,
            category: b.category,
            amount: BigDecimal::from_str(&b.amount.to_string())
                .unwrap_or_default(),
            vendor: b.vendor,
            description: b.description,
            start_date: b.start_date,
            end_date: b.end_date,
            file_id: b.file_id,
            created_by: claims.sub,
        })
        .await?;
    Ok(ApiResponse(expense.into()))
}

pub async fn list_expenses_handler(
    expense_service: web::Data<dyn BookingExpenseService>,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<Vec<BookingExpenseDTO>>, ApiError> {
    let expenses =
        expense_service.list_for_booking(path.into_inner()).await?;
    Ok(ApiResponse(expenses.into_iter().map(Into::into).collect()))
}

pub async fn delete_expense_handler(
    expense_service: web::Data<dyn BookingExpenseService>,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<Uuid>, ApiError> {
    let id = path.into_inner();
    expense_service.delete(id).await?;
    Ok(ApiResponse(id))
}
