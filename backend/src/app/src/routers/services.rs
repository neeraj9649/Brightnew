use actix_web::{middleware::from_fn, web};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::PgPool;

use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use base::{error::{ApiError, ApiResponse}, role};

#[derive(Deserialize, Serialize)]
struct Offer {
    title: String,
    description: String,
    #[serde(default)]
    image: String,
}

#[derive(Deserialize, Serialize)]
struct Service {
    title: String,
    description: String,
    kind: String,
    image: String,
    secondary_image: String,
    offers: Vec<Offer>,
    benefits: Vec<String>,
    is_published: bool,
    sort_order: i32,
}

fn tidy(value: &mut String, max: usize, required: bool) -> Result<(), ApiError> {
    *value = value.trim().to_owned();
    if (required && value.is_empty()) || value.chars().count() > max {
        return Err(ApiError::new(format!("Complete the required fields and keep each field within its {} character limit.", max), 400));
    }
    Ok(())
}

impl Service {
    fn validate(&mut self) -> Result<(), ApiError> {
        if !matches!(self.kind.as_str(), "flights" | "hotels" | "tours" | "transfers" | "activities" | "visa" | "general") {
            return Err(ApiError::new("Choose a service type.", 400));
        }
        tidy(&mut self.title, 120, true)?;
        tidy(&mut self.description, 800, true)?;
        for image in [&mut self.image, &mut self.secondary_image] {
            tidy(image, 1000, false)?;
            if !image.is_empty() && !super::blog::is_image_url(image) {
                return Err(ApiError::new("Enter a valid image URL or upload an image.", 400));
            }
        }
        if self.offers.len() > 12 || self.benefits.len() > 12 {
            return Err(ApiError::new("Add up to 12 offers and 12 benefits.", 400));
        }
        for offer in &mut self.offers {
            tidy(&mut offer.title, 100, true)?;
            tidy(&mut offer.description, 400, false)?;
            tidy(&mut offer.image, 1000, false)?;
            if !offer.image.is_empty() && !super::blog::is_image_url(&offer.image) {
                return Err(ApiError::new("Use a valid image URL for each offer photo.", 400));
            }
        }
        for benefit in &mut self.benefits {
            tidy(benefit, 250, true)?;
        }
        Ok(())
    }
}

async fn list(pool: &PgPool, public_only: bool) -> Result<ApiResponse<Value>, ApiError> {
    let items = sqlx::query_scalar(
        "SELECT COALESCE(jsonb_agg(content || jsonb_build_object('slug',slug,'is_published',is_published,'sort_order',sort_order)
         ORDER BY sort_order, slug), '[]'::jsonb) FROM website_services WHERE NOT $1 OR is_published",
    ).bind(public_only).fetch_one(pool).await?;
    Ok(ApiResponse(items))
}

async fn public_list(pool: web::Data<PgPool>) -> Result<ApiResponse<Value>, ApiError> {
    list(pool.get_ref(), true).await
}

async fn admin_list(pool: web::Data<PgPool>) -> Result<ApiResponse<Value>, ApiError> {
    list(pool.get_ref(), false).await
}

async fn detail(pool: web::Data<PgPool>, slug: web::Path<String>) -> Result<ApiResponse<Value>, ApiError> {
    let item = sqlx::query_scalar(
        "SELECT content || jsonb_build_object('slug',slug) FROM website_services WHERE slug = $1 AND is_published",
    ).bind(slug.as_str()).fetch_optional(pool.get_ref()).await?;
    Ok(ApiResponse(item.ok_or_else(|| ApiError::new("This service is unavailable.", 404))?))
}

fn service_slug(title: &str, number: u32) -> String {
    let base = if title.bytes().any(|byte| byte.is_ascii_alphanumeric()) {
        super::blog::slugify(title)
    } else {
        "service".to_owned()
    };
    let suffix = if number == 1 { String::new() } else { format!("-{number}") };
    let prefix = &base[..base.len().min(80 - suffix.len())];
    format!("{}{suffix}", prefix.trim_end_matches('-'))
}

async fn create(pool: web::Data<PgPool>, body: web::Json<Service>) -> Result<ApiResponse<Value>, ApiError> {
    let mut service = body.into_inner();
    service.validate()?;
    let content = serde_json::to_value(&service).map_err(base::error::internal)?;
    for number in 1..=1000 {
        let slug = service_slug(&service.title, number);
        let inserted = sqlx::query("INSERT INTO website_services (slug, content, is_published, sort_order)
             VALUES ($1, $2, $3, $4) ON CONFLICT (slug) DO NOTHING")
            .bind(&slug).bind(&content).bind(service.is_published).bind(service.sort_order).execute(pool.get_ref()).await?;
        if inserted.rows_affected() == 1 {
            return Ok(ApiResponse(json!({ "slug": slug })));
        }
    }
    Err(ApiError::new("Too many services use this title. Choose a different title.", 409))
}

async fn update(pool: web::Data<PgPool>, slug: web::Path<String>, body: web::Json<Service>) -> Result<ApiResponse<Value>, ApiError> {
    let mut service = body.into_inner();
    service.validate()?;
    let content = serde_json::to_value(&service).map_err(base::error::internal)?;
    let updated = sqlx::query("UPDATE website_services SET content=$2, is_published=$3, sort_order=$4 WHERE slug=$1")
        .bind(slug.as_str()).bind(content).bind(service.is_published).bind(service.sort_order).execute(pool.get_ref()).await?;
    if updated.rows_affected() == 0 {
        return Err(ApiError::new("This service does not exist.", 404));
    }
    Ok(ApiResponse(json!({ "slug": slug.as_str() })))
}

pub fn services_routes(cfg: &mut web::ServiceConfig) {
    cfg.route("/public/services", web::get().to(public_list))
        .route("/public/services/{slug}", web::get().to(detail))
        .service(web::scope("/admin/website-services")
            .wrap(from_fn(|req, next| async move { check_permission_middleware(req, next, role::ADMIN_ONLY).await }))
            .route("", web::get().to(admin_list))
            .route("", web::post().to(create))
            .route("/{slug}", web::put().to(update)));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn service_slugs_use_the_title_and_fit_the_database_limit() {
        assert_eq!(service_slug(" Hotel & Stay ", 1), "hotel-stay");
        assert_eq!(service_slug(" Hotel & Stay ", 2), "hotel-stay-2");
        assert_eq!(service_slug("यात्रा", 1), "service");
        assert_eq!(service_slug(&"a".repeat(120), 1000).len(), 80);
    }
}
