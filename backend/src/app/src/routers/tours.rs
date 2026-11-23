//! Website tours (Go_Travel_Brightwings site) and their reviews. Tables from migration 0038.
//!
//! Public, no sign-in:
//!   GET  /public/tours?limit=15&offset=0[&featured=true]   published tour cards + total
//!   GET  /public/tours/{slug}                              one tour page, 2 random other tours, approved reviews
//!   POST /public/tours/{slug}/reviews                      new review, saved as `pending`
//! Admin only (`/admin/tours`):
//!   GET  /items?limit&offset, POST /items, PUT /items/{id}   write and edit tours (hide = is_published false)
//!   GET  /reviews?status&limit&offset, PUT /reviews/{id}     approve or reject reviews
//!
//! Nothing is ever deleted: tours are hidden and reviews are rejected instead.

use std::time::Duration;

use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
    HttpRequest,
};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use base::{
    error::{internal, ApiError, ApiResponse},
    jwt_claims::JwtClaims,
    role,
};

use super::blog::{is_image_url, slugify};
use super::enquiries::plausible_email;

/// Reviews one IP address may post per hour.
const REVIEWS_PER_HOUR: u32 = 5;

/// Fields a tour card needs (Tours list, home page, related tours), for the tours row aliased `a`.
fn card_fields(a: &str) -> String {
    format!(
        "{a}.slug, {a}.title, {a}.card_image, {a}.location, {a}.duration, {a}.price, {a}.discount, {a}.rating,
         {a}.video_id, {a}.is_featured,
         (SELECT COUNT(*) FROM tour_reviews r WHERE r.tour_id = {a}.id AND r.status = 'approved') AS review_count"
    )
}

#[derive(Debug, Deserialize)]
pub struct PageQuery {
    #[serde(default)]
    pub limit: Option<i64>,
    #[serde(default)]
    pub offset: Option<i64>,
    #[serde(default)]
    pub featured: Option<bool>,
    #[serde(default)]
    pub status: Option<String>,
}

impl PageQuery {
    /// (limit, offset): default 15 / 0, limit capped at 100.
    fn page(&self) -> (i64, i64) {
        (self.limit.unwrap_or(15).clamp(1, 100), self.offset.unwrap_or(0).max(0))
    }
}

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

async fn list_public_handler(pool: web::Data<PgPool>, query: web::Query<PageQuery>) -> Result<ApiResponse<Value>, ApiError> {
    let (limit, offset) = query.page();
    let featured_only = query.featured.unwrap_or(false);
    let items: Value = sqlx::query_scalar(&format!(
        "SELECT COALESCE(json_agg(x ORDER BY x.sort_order, x.created_at), '[]'::json) FROM (
             SELECT {fields}, t.sort_order, t.created_at FROM tours t
             WHERE t.is_published AND (NOT $1 OR t.is_featured)
             ORDER BY t.sort_order, t.created_at LIMIT $2 OFFSET $3
         ) x",
        fields = card_fields("t")
    ))
    .bind(featured_only)
    .bind(limit)
    .bind(offset)
    .fetch_one(pool.get_ref())
    .await
    .map_err(internal)?;
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tours WHERE is_published AND (NOT $1 OR is_featured)")
        .bind(featured_only)
        .fetch_one(pool.get_ref())
        .await
        .map_err(internal)?;
    Ok(ApiResponse(json!({ "items": items, "total": total, "limit": limit, "offset": offset })))
}

async fn get_public_handler(pool: web::Data<PgPool>, slug: web::Path<String>) -> Result<ApiResponse<Value>, ApiError> {
    let tour: Option<Value> = sqlx::query_scalar(&format!(
        "SELECT json_build_object(
             'slug', t.slug, 'title', t.title, 'headline', t.headline, 'card_image', t.card_image,
             'location', t.location, 'duration', t.duration, 'activity_type', t.activity_type,
             'active_days', t.active_days, 'travelers', t.travelers, 'price', t.price, 'discount', t.discount,
             'rating', t.rating, 'video_id', t.video_id, 'overview', t.overview, 'slider_images', t.slider_images,
             'thumb_images', t.thumb_images, 'highlights', t.highlights, 'included', t.included,
             'excluded', t.excluded, 'faqs', t.faqs, 'map_embed_url', t.map_embed_url,
             'related', COALESCE((
                 SELECT json_agg(x) FROM (
                     SELECT {fields} FROM tours c
                     WHERE c.is_published AND c.id <> t.id
                     ORDER BY random() LIMIT 2
                 ) x
             ), '[]'::json),
             'reviews', COALESCE((
                 SELECT json_agg(json_build_object('name', r.name, 'rating', r.rating, 'message', r.message, 'created_at', r.created_at) ORDER BY r.created_at DESC)
                 FROM tour_reviews r WHERE r.tour_id = t.id AND r.status = 'approved'
             ), '[]'::json))
         FROM tours t WHERE t.slug = $1 AND t.is_published",
        fields = card_fields("c")
    ))
    .bind(slug.as_str())
    .fetch_optional(pool.get_ref())
    .await
    .map_err(internal)?;
    tour.map(ApiResponse).ok_or_else(|| ApiError::new("This tour was not found", 404))
}

#[derive(Debug, Deserialize)]
pub struct ReviewDTO {
    pub name: String,
    pub email: String,
    pub rating: i16,
    pub message: String,
}

/// Checks a visitor's review; returns (name, email, rating, message) tidied. Messages are shown to the visitor.
fn validate_review(body: ReviewDTO) -> Result<(String, String, i16, String), ApiError> {
    let name = body.name.trim().to_string();
    if name.is_empty() || name.chars().count() > 100 || name.chars().any(char::is_control) {
        return Err(ApiError::new("Please enter your name", 400));
    }
    let email = body.email.trim().to_lowercase();
    if email.len() > 200 || !plausible_email(&email) {
        return Err(ApiError::new("Please enter a valid e-mail address", 400));
    }
    if !(1..=5).contains(&body.rating) {
        return Err(ApiError::new("Please choose a rating from 1 to 5 stars", 400));
    }
    let message = body.message.trim().to_string();
    if message.is_empty() {
        return Err(ApiError::new("Please write your review", 400));
    }
    if message.chars().count() > 2000 {
        return Err(ApiError::new("Your review is too long. Please keep it under 2000 characters.", 400));
    }
    Ok((name, email, body.rating, message))
}

async fn create_review_handler(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    slug: web::Path<String>,
    body: web::Json<ReviewDTO>,
) -> Result<ApiResponse<Value>, ApiError> {
    let (name, email, rating, message) = validate_review(body.into_inner())?;
    let tour_id: Option<Uuid> = sqlx::query_scalar("SELECT id FROM tours WHERE slug = $1 AND is_published")
        .bind(slug.as_str())
        .fetch_optional(pool.get_ref())
        .await
        .map_err(internal)?;
    let tour_id = tour_id.ok_or_else(|| ApiError::new("This tour was not found", 404))?;

    let ip = req.connection_info().realip_remote_addr().unwrap_or("unknown").to_string();
    base::rate_limit::LIMITER.hit(&format!("tour-review:{ip}"), REVIEWS_PER_HOUR, Duration::from_secs(60 * 60))?;

    sqlx::query("INSERT INTO tour_reviews (tour_id, name, email, rating, message, ip_address) VALUES ($1, $2, $3, $4, $5, $6)")
        .bind(tour_id)
        .bind(&name)
        .bind(&email)
        .bind(rating)
        .bind(&message)
        .bind(ip.chars().take(64).collect::<String>())
        .execute(pool.get_ref())
        .await
        .map_err(internal)?;
    Ok(ApiResponse(json!({ "status": "pending" })))
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize, serde::Serialize, PartialEq)]
pub struct Faq {
    pub question: String,
    pub answer: String,
}

#[derive(Debug, Deserialize)]
pub struct TourDTO {
    pub title: String,
    #[serde(default)]
    pub headline: String,
    pub card_image: String,
    #[serde(default)]
    pub location: String,
    #[serde(default)]
    pub duration: String,
    #[serde(default)]
    pub activity_type: String,
    #[serde(default)]
    pub active_days: String,
    #[serde(default = "one")]
    pub travelers: i32,
    #[serde(default)]
    pub price: String,
    #[serde(default)]
    pub discount: Option<i32>,
    #[serde(default = "five")]
    pub rating: i16,
    #[serde(default)]
    pub video_id: String,
    #[serde(default)]
    pub overview: String,
    #[serde(default)]
    pub slider_images: Vec<String>,
    #[serde(default)]
    pub thumb_images: Vec<String>,
    #[serde(default)]
    pub highlights: Vec<String>,
    #[serde(default)]
    pub included: Vec<String>,
    #[serde(default)]
    pub excluded: Vec<String>,
    #[serde(default)]
    pub faqs: Vec<Faq>,
    #[serde(default)]
    pub map_embed_url: String,
    #[serde(default)]
    pub is_featured: bool,
    #[serde(default = "yes")]
    pub is_published: bool,
    #[serde(default)]
    pub sort_order: i32,
}

fn one() -> i32 {
    1
}
fn five() -> i16 {
    5
}
fn yes() -> bool {
    true
}

/// Trims every entry, drops empty ones, and checks count and length.
fn clean_list(items: Vec<String>, max_items: usize, max_len: usize, what: &str) -> Result<Vec<String>, ApiError> {
    let items: Vec<String> = items.into_iter().map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).collect();
    if items.len() > max_items || items.iter().any(|s| s.chars().count() > max_len) {
        return Err(ApiError::new(format!("Use up to {max_items} {what} of up to {max_len} characters"), 400));
    }
    Ok(items)
}

fn short_text(value: String, max: usize, what: &str) -> Result<String, ApiError> {
    let value = value.trim().to_string();
    if value.chars().count() > max || value.chars().any(char::is_control) {
        return Err(ApiError::new(format!("{what} is too long (up to {max} characters)"), 400));
    }
    Ok(value)
}

/// Checks and tidies a tour from the admin form.
fn validate_tour(mut t: TourDTO) -> Result<TourDTO, ApiError> {
    t.title = short_text(t.title, 200, "Title")?;
    if t.title.is_empty() {
        return Err(ApiError::new("Give the tour a title", 400));
    }
    t.headline = short_text(t.headline, 300, "Page title")?;
    t.card_image = t.card_image.trim().to_string();
    if !is_image_url(&t.card_image) {
        return Err(ApiError::new("Upload a card image", 400));
    }
    t.location = short_text(t.location, 120, "Location")?;
    t.duration = short_text(t.duration, 120, "Duration")?;
    t.activity_type = short_text(t.activity_type, 120, "Activity type")?;
    t.active_days = short_text(t.active_days, 120, "Active days")?;
    t.price = short_text(t.price, 60, "Price")?;
    if t.price.is_empty() {
        t.price = "Contact Us".to_string();
    }
    if !(1..=1000).contains(&t.travelers) {
        return Err(ApiError::new("Travelers must be between 1 and 1000", 400));
    }
    if t.discount.is_some_and(|d| !(1..=99).contains(&d)) {
        return Err(ApiError::new("Discount must be between 1 and 99 percent", 400));
    }
    if !(1..=5).contains(&t.rating) {
        return Err(ApiError::new("Rating must be 1 to 5 stars", 400));
    }
    t.video_id = t.video_id.trim().to_string();
    if t.video_id.len() > 40 || !t.video_id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_') {
        return Err(ApiError::new("Enter only the YouTube video id (the part after v=)", 400));
    }
    t.overview = t.overview.trim().to_string();
    if t.overview.chars().count() > 20_000 {
        return Err(ApiError::new("Overview is too long (up to 20000 characters)", 400));
    }
    t.slider_images = clean_list(t.slider_images, 12, 1000, "slider images")?;
    t.thumb_images = clean_list(t.thumb_images, 2, 1000, "photos")?;
    if !t.slider_images.iter().chain(&t.thumb_images).all(|u| is_image_url(u)) {
        return Err(ApiError::new("One of the images is not a valid upload", 400));
    }
    t.highlights = clean_list(t.highlights, 30, 200, "highlights")?;
    t.included = clean_list(t.included, 30, 200, "included items")?;
    t.excluded = clean_list(t.excluded, 30, 200, "excluded items")?;
    t.faqs = t
        .faqs
        .into_iter()
        .map(|f| Faq { question: f.question.trim().to_string(), answer: f.answer.trim().to_string() })
        .filter(|f| !f.question.is_empty())
        .collect();
    if t.faqs.len() > 20 || t.faqs.iter().any(|f| f.question.chars().count() > 300 || f.answer.chars().count() > 5000) {
        return Err(ApiError::new("Use up to 20 tour plan steps (question up to 300, answer up to 5000 characters)", 400));
    }
    t.map_embed_url = t.map_embed_url.trim().to_string();
    // Shown in an iframe, so only Google Maps embed links are accepted.
    if !t.map_embed_url.is_empty() && !t.map_embed_url.starts_with("https://www.google.com/maps/embed") {
        return Err(ApiError::new("Paste the Google Maps embed link (Share > Embed a map > the src link)", 400));
    }
    Ok(t)
}

const ADMIN_TOUR_FIELDS: &str = "t.id, t.slug, t.title, t.headline, t.card_image, t.location, t.duration, t.activity_type,
     t.active_days, t.travelers, t.price, t.discount, t.rating, t.video_id, t.overview, t.slider_images, t.thumb_images,
     t.highlights, t.included, t.excluded, t.faqs, t.map_embed_url, t.is_featured, t.is_published,
     t.sort_order, t.created_at, t.updated_at,
     (SELECT COUNT(*) FROM tour_reviews r WHERE r.tour_id = t.id AND r.status = 'pending') AS pending_reviews";

async fn admin_tour_json(pool: &PgPool, id: Uuid) -> Result<Value, ApiError> {
    sqlx::query_scalar::<_, Value>(&format!("SELECT row_to_json(x) FROM (SELECT {ADMIN_TOUR_FIELDS} FROM tours t WHERE t.id = $1) x"))
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(internal)?
        .ok_or_else(|| ApiError::new("This tour was not found", 404))
}

async fn list_admin_handler(pool: web::Data<PgPool>, query: web::Query<PageQuery>) -> Result<ApiResponse<Value>, ApiError> {
    let (limit, offset) = query.page();
    let items: Value = sqlx::query_scalar(&format!(
        "SELECT COALESCE(json_agg(x ORDER BY x.sort_order, x.created_at), '[]'::json) FROM (
             SELECT {ADMIN_TOUR_FIELDS} FROM tours t ORDER BY t.sort_order, t.created_at LIMIT $1 OFFSET $2
         ) x"
    ))
    .bind(limit)
    .bind(offset)
    .fetch_one(pool.get_ref())
    .await
    .map_err(internal)?;
    let (total, pending): (i64, i64) = sqlx::query_as(
        "SELECT (SELECT COUNT(*) FROM tours), (SELECT COUNT(*) FROM tour_reviews WHERE status = 'pending')",
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(internal)?;
    Ok(ApiResponse(json!({ "items": items, "total": total, "limit": limit, "offset": offset, "pending_reviews": pending })))
}

/// Binds every editable column in the order $2..$24 used by the INSERT and UPDATE below.
macro_rules! bind_tour {
    ($query:expr, $t:expr) => {
        $query
            .bind(&$t.title)
            .bind(&$t.headline)
            .bind(&$t.card_image)
            .bind(&$t.location)
            .bind(&$t.duration)
            .bind(&$t.activity_type)
            .bind(&$t.active_days)
            .bind($t.travelers)
            .bind(&$t.price)
            .bind($t.discount)
            .bind($t.rating)
            .bind(&$t.video_id)
            .bind(&$t.overview)
            .bind(&$t.slider_images)
            .bind(&$t.thumb_images)
            .bind(&$t.highlights)
            .bind(&$t.included)
            .bind(&$t.excluded)
            .bind(sqlx::types::Json(&$t.faqs))
            .bind(&$t.map_embed_url)
            .bind($t.is_featured)
            .bind($t.is_published)
            .bind($t.sort_order)
    };
}

async fn create_tour_handler(pool: web::Data<PgPool>, body: web::Json<TourDTO>) -> Result<ApiResponse<Value>, ApiError> {
    let t = validate_tour(body.into_inner())?;
    let base = slugify(&t.title);
    // First free slug: "title", then "title-2", "title-3", ...
    let taken: Vec<String> = sqlx::query_scalar("SELECT slug FROM tours WHERE slug = $1 OR slug LIKE $1 || '-%'")
        .bind(&base)
        .fetch_all(pool.get_ref())
        .await
        .map_err(internal)?;
    let slug = (1..)
        .map(|n| if n == 1 { base.clone() } else { format!("{base}-{n}") })
        .find(|s| !taken.contains(s))
        .expect("an unused slug always exists");

    let id: Uuid = bind_tour!(
        sqlx::query_scalar(
            "INSERT INTO tours (slug, title, headline, card_image, location, duration, activity_type, active_days, travelers,
                 price, discount, rating, video_id, overview, slider_images, thumb_images, highlights, included, excluded,
                 faqs, map_embed_url, is_featured, is_published, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
             RETURNING id",
        )
        .bind(&slug),
        t
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(internal)?;
    Ok(ApiResponse(admin_tour_json(pool.get_ref(), id).await?))
}

async fn update_tour_handler(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    body: web::Json<TourDTO>,
) -> Result<ApiResponse<Value>, ApiError> {
    let t = validate_tour(body.into_inner())?;
    // The slug stays the same on edit so links people already shared keep working.
    let updated = bind_tour!(
        sqlx::query(
            "UPDATE tours SET title = $2, headline = $3, card_image = $4, location = $5, duration = $6, activity_type = $7,
                 active_days = $8, travelers = $9, price = $10, discount = $11, rating = $12, video_id = $13, overview = $14,
                 slider_images = $15, thumb_images = $16, highlights = $17, included = $18, excluded = $19, faqs = $20,
                 map_embed_url = $21, is_featured = $22, is_published = $23, sort_order = $24,
                 updated_at = NOW()
             WHERE id = $1",
        )
        .bind(*id),
        t
    )
    .execute(pool.get_ref())
    .await
    .map_err(internal)?;
    if updated.rows_affected() == 0 {
        return Err(ApiError::new("This tour was not found", 404));
    }
    Ok(ApiResponse(admin_tour_json(pool.get_ref(), *id).await?))
}

async fn list_reviews_handler(pool: web::Data<PgPool>, query: web::Query<PageQuery>) -> Result<ApiResponse<Value>, ApiError> {
    let status = query.status.clone().unwrap_or_else(|| "pending".to_string());
    if !["pending", "approved", "rejected"].contains(&status.as_str()) {
        return Err(ApiError::new("Unknown review status", 400));
    }
    let (limit, offset) = query.page();
    let items: Value = sqlx::query_scalar(
        "SELECT COALESCE(json_agg(x ORDER BY x.created_at DESC), '[]'::json) FROM (
             SELECT r.id, r.name, r.email, r.rating, r.message, r.status, r.created_at, r.reviewed_at,
                    t.slug AS tour_slug, t.title AS tour_title
             FROM tour_reviews r JOIN tours t ON t.id = r.tour_id
             WHERE r.status = $1 ORDER BY r.created_at DESC LIMIT $2 OFFSET $3
         ) x",
    )
    .bind(&status)
    .bind(limit)
    .bind(offset)
    .fetch_one(pool.get_ref())
    .await
    .map_err(internal)?;
    let total: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM tour_reviews WHERE status = $1")
        .bind(&status)
        .fetch_one(pool.get_ref())
        .await
        .map_err(internal)?;
    Ok(ApiResponse(json!({ "items": items, "total": total, "limit": limit, "offset": offset })))
}

#[derive(Debug, Deserialize)]
pub struct ReviewStatusDTO {
    pub status: String,
}

async fn review_status_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    id: web::Path<Uuid>,
    body: web::Json<ReviewStatusDTO>,
) -> Result<ApiResponse<Value>, ApiError> {
    if !["approved", "rejected"].contains(&body.status.as_str()) {
        return Err(ApiError::new("Choose approve or reject", 400));
    }
    let updated = sqlx::query("UPDATE tour_reviews SET status = $2, reviewed_by = $3, reviewed_at = NOW() WHERE id = $1")
        .bind(*id)
        .bind(&body.status)
        .bind(claims.sub)
        .execute(pool.get_ref())
        .await
        .map_err(internal)?;
    if updated.rows_affected() == 0 {
        return Err(ApiError::new("This review was not found", 404));
    }
    Ok(ApiResponse(json!({ "id": *id, "status": body.status })))
}

pub fn tours_routes(cfg: &mut ServiceConfig) {
    // Plain routes, not a `/public` scope: other /public/* routes live in other routers,
    // and actix scopes do not fall through.
    cfg.route("/public/tours", web::get().to(list_public_handler))
        .route("/public/tours/{slug}", web::get().to(get_public_handler))
        .route("/public/tours/{slug}/reviews", web::post().to(create_review_handler))
        .service(
            web::scope("/admin/tours")
                .wrap(from_fn(|req, next| async move {
                    check_permission_middleware(req, next, role::ADMIN_ONLY).await
                }))
                .route("/items", web::get().to(list_admin_handler))
                .route("/items", web::post().to(create_tour_handler))
                .route("/items/{id}", web::put().to(update_tour_handler))
                .route("/reviews", web::get().to(list_reviews_handler))
                .route("/reviews/{id}", web::put().to(review_status_handler)),
        );
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tour() -> TourDTO {
        serde_json::from_value(json!({ "title": " Burj Khalifa ", "card_image": "https://x.in/a.jpg" })).unwrap()
    }

    #[test]
    fn defaults_and_tidying() {
        let t = validate_tour(tour()).unwrap();
        assert_eq!(t.title, "Burj Khalifa");
        assert_eq!(t.price, "Contact Us");
        assert_eq!((t.travelers, t.rating, t.is_published), (1, 5, true));
    }

    #[test]
    fn rejects_bad_tours() {
        let mut t = tour();
        t.card_image = String::new();
        assert!(validate_tour(t).is_err());
        let mut t = tour();
        t.discount = Some(100);
        assert!(validate_tour(t).is_err());
        let mut t = tour();
        t.map_embed_url = "https://evil.example/embed".into();
        assert!(validate_tour(t).is_err());
        let mut t = tour();
        t.video_id = "https://youtube.com/watch?v=x".into();
        assert!(validate_tour(t).is_err());
    }

    #[test]
    fn faqs_drop_empty_rows() {
        let mut t = tour();
        t.faqs = vec![Faq { question: " Day 1 ".into(), answer: " Arrive ".into() }, Faq { question: " ".into(), answer: "x".into() }];
        let t = validate_tour(t).unwrap();
        assert_eq!(t.faqs, vec![Faq { question: "Day 1".into(), answer: "Arrive".into() }]);
    }

    #[test]
    fn review_validation() {
        let r = |rating| ReviewDTO { name: "Asha".into(), email: "a@b.co".into(), rating, message: "Lovely".into() };
        assert!(validate_review(r(5)).is_ok());
        assert!(validate_review(r(0)).is_err());
        assert!(validate_review(r(6)).is_err());
    }

    #[test]
    fn paging_defaults_and_caps() {
        let q = |limit, offset| PageQuery { limit, offset, featured: None, status: None };
        assert_eq!(q(None, None).page(), (15, 0));
        assert_eq!(q(Some(500), Some(-3)).page(), (100, 0));
    }
}
