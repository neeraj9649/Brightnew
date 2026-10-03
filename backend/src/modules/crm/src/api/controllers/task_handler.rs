use actix_web::web;
use base::error::{ApiError, ApiResponse};
use base::jwt_claims::JwtClaims;
use base::role;
use uuid::Uuid;

use crate::api::dto::task::{CreateTaskDTO, ListMyTasksQuery, TaskDTO};
use crate::domain::services::task::TaskService;

pub async fn create_task_handler(
    task_service: web::Data<dyn TaskService>,
    claims: JwtClaims,
    body: web::Json<CreateTaskDTO>,
) -> Result<ApiResponse<TaskDTO>, ApiError> {
    let body = body.into_inner();
    let task = task_service
        .create_task(
            body.booking_id,
            body.assigned_to,
            body.title,
            body.description,
            body.due_at,
            claims.sub,
        )
        .await?;
    Ok(ApiResponse(task.into()))
}

pub async fn list_my_tasks_handler(
    task_service: web::Data<dyn TaskService>,
    claims: JwtClaims,
    query: web::Query<ListMyTasksQuery>,
) -> Result<ApiResponse<Vec<TaskDTO>>, ApiError> {
    let assigned_to = if claims.role == role::EMPLOYEE {
        claims.sub
    } else {
        query.into_inner().assigned_to.unwrap_or(claims.sub)
    };
    let tasks = task_service.list_for_employee(assigned_to).await?;
    Ok(ApiResponse(tasks.into_iter().map(Into::into).collect()))
}

pub async fn list_tasks_for_booking_handler(
    task_service: web::Data<dyn TaskService>,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<Vec<TaskDTO>>, ApiError> {
    let tasks = task_service.list_for_booking(path.into_inner()).await?;
    Ok(ApiResponse(tasks.into_iter().map(Into::into).collect()))
}

pub async fn complete_task_handler(
    task_service: web::Data<dyn TaskService>,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<TaskDTO>, ApiError> {
    let task = task_service.complete(path.into_inner()).await?;
    Ok(ApiResponse(task.into()))
}

pub async fn cancel_task_handler(
    task_service: web::Data<dyn TaskService>,
    path: web::Path<Uuid>,
) -> Result<ApiResponse<TaskDTO>, ApiError> {
    let task = task_service.cancel(path.into_inner()).await?;
    Ok(ApiResponse(task.into()))
}
