use actix_web::web;
use base::error::{ApiError, ApiResponse};
use base::jwt_claims::JwtClaims;
use base::role;
use uuid::Uuid;

use crate::api::dto::booking::{
    AdminListBookingsQuery, AdminUpdateBookingDTO, BookingDTO, CreateBookingDTO,
    StaffCreateBookingDTO,
};
use crate::domain::models::booking::UpdateBooking;
use crate::domain::services::booking::BookingService;

pub async fn create_booking_handler(
    booking_service: web::Data<dyn BookingService>,
    claims: JwtClaims,
    body: web::Json<CreateBookingDTO>,
) -> Result<ApiResponse<BookingDTO>, ApiError> {
    let booking =
        booking_service.create(body.into_inner().into_entity(claims.sub)).await?;
    Ok(ApiResponse(booking.into()))
}

/// Admin/employee creates a booking on behalf of a customer (`user_id` in the
/// body), reusing the same create flow as the customer-facing handler.
pub async fn staff_create_booking_handler(
    booking_service: web::Data<dyn BookingService>,
    body: web::Json<StaffCreateBookingDTO>,
) -> Result<ApiResponse<BookingDTO>, ApiError> {
    let body = body.into_inner();
    let booking =
        booking_service.create(body.booking.into_entity(body.user_id)).await?;
    Ok(ApiResponse(booking.into()))
}

pub async fn list_my_bookings_handler(
    booking_service: web::Data<dyn BookingService>,
    claims: JwtClaims,
) -> Result<ApiResponse<Vec<BookingDTO>>, ApiError> {
    let bookings = booking_service.list_for_user(claims.sub).await?;
    Ok(ApiResponse(bookings.into_iter().map(Into::into).collect()))
}

pub async fn get_booking_handler(
    booking_service: web::Data<dyn BookingService>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<BookingDTO>, ApiError> {
    let booking =
        booking_service.get_owned(path.into_inner(), claims.sub).await?;
    Ok(ApiResponse(booking.into()))
}

pub async fn cancel_booking_handler(
    booking_service: web::Data<dyn BookingService>,
    claims: JwtClaims,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<BookingDTO>, ApiError> {
    let booking =
        booking_service.cancel(path.into_inner(), claims.sub).await?;
    Ok(ApiResponse(booking.into()))
}

pub async fn admin_list_bookings_handler(
    booking_service: web::Data<dyn BookingService>,
    claims: JwtClaims,
    query: web::Query<AdminListBookingsQuery>,
) -> Result<ApiResponse<Vec<BookingDTO>>, ApiError> {
    let query = query.into_inner();
    let assigned_employee_id = if claims.role == role::EMPLOYEE {
        Some(claims.sub)
    } else {
        query.assigned_employee_id
    };
    let bookings =
        booking_service.list_all(query.status, assigned_employee_id).await?;
    Ok(ApiResponse(bookings.into_iter().map(Into::into).collect()))
}

pub async fn admin_update_booking_handler(
    booking_service: web::Data<dyn BookingService>,
    claims: JwtClaims,
    body: web::Json<AdminUpdateBookingDTO>,
) -> Result<ApiResponse<BookingDTO>, ApiError> {
    let body = body.into_inner();
    let acting_employee_id =
        if claims.role == role::EMPLOYEE { Some(claims.sub) } else { None };
    let booking = booking_service
        .admin_update(
            UpdateBooking {
                id: body.id,
                status: body.status,
                final_cost: body
                    .final_cost
                    .map(|cost| cost.to_string().parse().unwrap_or_default()),
                payment_status: body.payment_status,
                admin_notes: body.admin_notes,
                assigned_employee_id: body.assigned_employee_id,
            },
            acting_employee_id,
        )
        .await?;
    Ok(ApiResponse(booking.into()))
}
