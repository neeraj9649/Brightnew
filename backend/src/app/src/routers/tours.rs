//! Website tours (Go_Travel_Brightwings site) and their reviews. Tables from migration 0038.
//!
//! Public, no sign-in:
//!   GET  /public/tours?limit=15&offset=0[&featured=true][&location=Dubai]   published tour cards + total
//!   GET  /public/tour-locations                            locations that have published tours (Tours page filter)
//!   GET  /public/tours/{slug}                              one tour page, 2 random other tours, approved reviews
//!   POST /public/tours/{slug}/reviews                      new review, saved as `pending`
//!   GET  /public/tour-reviews?limit=20&offset=0            approved reviews from every tour (home page)
//!   POST /public/tours/{slug}/booking                      "Book This Tour" enquiry (contact + trip), e-mailed to BOOKING_TO_EMAIL
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
        "{a}.slug, {a}.title, {a}.card_image, {a}.location, {a}.discount, {a}.rating, {a}.is_featured,
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
    /// Tours page location filter (exact location, case-insensitive). Empty = all.
    #[serde(default)]
    pub location: Option<String>,
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
    let location = query.location.as_deref().map(str::trim).filter(|l| !l.is_empty());
    let items: Value = sqlx::query_scalar(&format!(
        "SELECT COALESCE(json_agg(x ORDER BY x.sort_order, x.created_at), '[]'::json) FROM (
             SELECT {fields}, t.sort_order, t.created_at FROM tours t
             WHERE t.is_published AND (NOT $1 OR t.is_featured)
               AND ($4::text IS NULL OR lower(trim(t.location)) = lower($4))
             ORDER BY t.sort_order, t.created_at LIMIT $2 OFFSET $3
         ) x",
        fields = card_fields("t")
    ))
    .bind(featured_only)
    .bind(limit)
    .bind(offset)
    .bind(location)
    .fetch_one(pool.get_ref())
    .await
    .map_err(internal)?;
    let total: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM tours
         WHERE is_published AND (NOT $1 OR is_featured) AND ($2::text IS NULL OR lower(trim(location)) = lower($2))",
    )
    .bind(featured_only)
    .bind(location)
    .fetch_one(pool.get_ref())
    .await
    .map_err(internal)?;
    Ok(ApiResponse(json!({ "items": items, "total": total, "limit": limit, "offset": offset })))
}

/// Tours page location dropdown: each location that has at least one published tour, A to Z.
async fn list_locations_handler(pool: web::Data<PgPool>) -> Result<ApiResponse<Value>, ApiError> {
    let locations: Vec<String> = sqlx::query_scalar(
        "SELECT MIN(trim(location)) FROM tours
         WHERE is_published AND trim(location) <> ''
         GROUP BY lower(trim(location)) ORDER BY 1",
    )
    .fetch_all(pool.get_ref())
    .await
    .map_err(internal)?;
    Ok(ApiResponse(json!(locations)))
}

async fn get_public_handler(pool: web::Data<PgPool>, slug: web::Path<String>) -> Result<ApiResponse<Value>, ApiError> {
    let tour: Option<Value> = sqlx::query_scalar(&format!(
        "SELECT json_build_object(
             'slug', t.slug, 'title', t.title, 'headline', t.headline, 'card_image', t.card_image,
             'location', t.location, 'discount', t.discount,
             'rating', t.rating, 'overview', t.overview, 'slider_images', t.slider_images,
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

/// Home page testimonials: approved reviews from every published tour, newest first.
/// Only name and message are returned; e-mail addresses are never public.
async fn list_public_reviews_handler(pool: web::Data<PgPool>, query: web::Query<PageQuery>) -> Result<ApiResponse<Value>, ApiError> {
    let (limit, offset) = query.page();
    let items: Value = sqlx::query_scalar(
        "SELECT COALESCE(json_agg(json_build_object('name', x.name, 'message', x.message) ORDER BY x.created_at DESC), '[]'::json)
         FROM (
             SELECT r.name, r.message, r.created_at
             FROM tour_reviews r JOIN tours t ON t.id = r.tour_id
             WHERE r.status = 'approved' AND t.is_published
             ORDER BY r.created_at DESC LIMIT $1 OFFSET $2
         ) x",
    )
    .bind(limit)
    .bind(offset)
    .fetch_one(pool.get_ref())
    .await
    .map_err(internal)?;
    let total: i64 = sqlx::query_scalar(
        "SELECT COUNT(*) FROM tour_reviews r JOIN tours t ON t.id = r.tour_id WHERE r.status = 'approved' AND t.is_published",
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(internal)?;
    Ok(ApiResponse(json!({ "items": items, "total": total, "limit": limit, "offset": offset })))
}

/// Where "Book This Tour" requests are e-mailed (env `BOOKING_TO_EMAIL` overrides).
const DEFAULT_BOOKING_TO: &str = "info@brightwingstravel.com";
/// Booking requests one IP address may send per hour.
const BOOKINGS_PER_HOUR: u32 = 10;

/// What a tour booking can include. Labels are shown as written on the website and in the e-mail.
pub(crate) const BOOKING_INCLUDES: [&str; 3] =
    ["Airport Pickup & Drop", "Private AC Cab for All Days", "Hindi/English Speaking Tour Guide"];

#[derive(Debug, Deserialize)]
pub struct BookingDTO {
    pub name: String,
    pub email: String,
    /// Phone or WhatsApp number.
    pub phone: String,
    pub departure_address: String,
    pub from: chrono::NaiveDate,
    pub to: chrono::NaiveDate,
    pub travellers: i32,
    /// Chosen entries of BOOKING_INCLUDES.
    #[serde(default)]
    pub includes: Vec<String>,
    /// Message / special request (optional).
    #[serde(default)]
    pub message: String,
}

/// "5 Days, 4 Nights" (same day = "1 Day"). Days count both the first and the last day.
fn trip_length(from: chrono::NaiveDate, to: chrono::NaiveDate) -> String {
    let nights = (to - from).num_days().max(0);
    let days = nights + 1;
    let plural = |n: i64, word: &str| format!("{n} {word}{}", if n == 1 { "" } else { "s" });
    if nights == 0 { plural(days, "Day") } else { format!("{}, {}", plural(days, "Day"), plural(nights, "Night")) }
}

/// Checks the enquiry and tidies the visitor's details. Messages are shown to the visitor.
fn validate_booking(b: &mut BookingDTO) -> Result<(), ApiError> {
    b.name = b.name.trim().to_string();
    if b.name.is_empty() || b.name.chars().count() > 100 || b.name.chars().any(char::is_control) {
        return Err(ApiError::new("Please enter your name", 400));
    }
    b.email = b.email.trim().to_lowercase();
    if b.email.len() > 200 || !plausible_email(&b.email) {
        return Err(ApiError::new("Please enter a valid e-mail address", 400));
    }
    b.phone = b.phone.trim().to_string();
    let digits = b.phone.chars().filter(char::is_ascii_digit).count();
    if b.phone.len() > 30 || !b.phone.chars().all(|c| c.is_ascii_digit() || " +-()".contains(c)) || !(7..=15).contains(&digits) {
        return Err(ApiError::new("Please enter a valid phone / WhatsApp number", 400));
    }
    b.departure_address = b.departure_address.trim().to_string();
    if b.departure_address.is_empty() || b.departure_address.chars().count() > 300 {
        return Err(ApiError::new("Please enter your departure address (up to 300 characters)", 400));
    }
    if b.to < b.from {
        return Err(ApiError::new("The To date can't be before the From date", 400));
    }
    if !(1..=500).contains(&b.travellers) {
        return Err(ApiError::new("Travellers must be between 1 and 500", 400));
    }
    // Keep only known options, once each, in the website's order.
    b.includes = BOOKING_INCLUDES.iter().filter(|o| b.includes.iter().any(|i| i == *o)).map(|o| o.to_string()).collect();
    b.message = b.message.trim().to_string();
    if b.message.chars().count() > 2000 {
        return Err(ApiError::new("Your message is too long. Please keep it under 2000 characters.", 400));
    }
    Ok(())
}

/// The quotation request e-mail: plain text in clear sections, so it reads well in any mail app.
fn booking_text(title: &str, link: &str, b: &BookingDTO, received: &str) -> String {
    const LINE: &str = "------------------------------------------------------------";
    let includes = if b.includes.is_empty() {
        "  None".to_string()
    } else {
        b.includes.iter().map(|i| format!("  - {i}")).collect::<Vec<_>>().join("\n")
    };
    let message = if b.message.is_empty() { "  (none)".to_string() } else { format!("  {}", b.message.replace('\n', "\n  ")) };
    format!(
        "NEW QUOTATION REQUEST - Bright Wings website\n\
         Received: {received}\n\n\
         {LINE}\nCUSTOMER\n{LINE}\n\
         Name:               {}\n\
         Phone / WhatsApp:   {}\n\
         E-mail:             {}\n\
         Departure address:  {}\n\n\
         {LINE}\nTRIP\n{LINE}\n\
         Tour:               {title}\n\
         Tour page:          {link}\n\
         From:               {}\n\
         To:                 {}\n\
         Duration:           {}\n\
         Travellers:         {}\n\n\
         Includes:\n{includes}\n\n\
         {LINE}\nMESSAGE / SPECIAL REQUEST\n{LINE}\n\
         {message}\n\n\
         Reply to this e-mail to answer {} directly.\n",
        b.name,
        b.phone,
        b.email,
        b.departure_address,
        b.from.format("%d/%m/%Y"),
        b.to.format("%d/%m/%Y"),
        trip_length(b.from, b.to),
        b.travellers,
        b.name,
    )
}

/// "Book This Tour" quotation request: e-mailed to the office. E-mail is the only channel (nothing is
/// stored), so a failed send is reported to the visitor, who can try again.
async fn create_booking_handler(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    slug: web::Path<String>,
    body: web::Json<BookingDTO>,
) -> Result<ApiResponse<Value>, ApiError> {
    let mut b = body.into_inner();
    validate_booking(&mut b)?;
    let title: Option<String> = sqlx::query_scalar("SELECT title FROM tours WHERE slug = $1 AND is_published")
        .bind(slug.as_str())
        .fetch_optional(pool.get_ref())
        .await
        .map_err(internal)?;
    let title = title.ok_or_else(|| ApiError::new("This tour was not found", 404))?;

    let ip = req.connection_info().realip_remote_addr().unwrap_or("unknown").to_string();
    base::rate_limit::LIMITER.hit(&format!("tour-booking:{ip}"), BOOKINGS_PER_HOUR, Duration::from_secs(60 * 60))?;

    let to = std::env::var("BOOKING_TO_EMAIL")
        .ok()
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| DEFAULT_BOOKING_TO.to_string());
    let link = format!("https://brightwingstravel.com/tour/{}/", slug.as_str());
    let ist = chrono::FixedOffset::east_opt(5 * 3600 + 30 * 60).expect("valid IST offset");
    let received = chrono::Utc::now().with_timezone(&ist).format("%d %b %Y, %I:%M %p IST").to_string();
    let subject = format!("Quotation request: {title} - {}", b.name);
    let text = booking_text(&title, &link, &b, &received);
    let reply_to = b.email.clone();
    let sent = web::block(move || shared::mail::send_enquiry_email(&to, Some(reply_to.as_str()), &subject, &text))
        .await
        .map_err(|e| e.to_string())
        .and_then(|r| r);
    if let Err(err) = sent {
        log::error!("tour quotation mail for {} not sent: {err}", slug.as_str());
        return Err(ApiError::new(
            "We couldn't send your request right now. Please try again in a minute, or call us on +91 7732957732.",
            502,
        ));
    }
    Ok(ApiResponse(json!({ "status": "sent" })))
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
    pub discount: Option<i32>,
    #[serde(default = "five")]
    pub rating: i16,
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
    if t.location.is_empty() {
        return Err(ApiError::new("Enter the tour's location", 400));
    }
    if t.discount.is_some_and(|d| !(1..=99).contains(&d)) {
        return Err(ApiError::new("Discount must be between 1 and 99 percent", 400));
    }
    if !(1..=5).contains(&t.rating) {
        return Err(ApiError::new("Rating must be 1 to 5 stars", 400));
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

const ADMIN_TOUR_FIELDS: &str = "t.id, t.slug, t.title, t.headline, t.card_image, t.location,
     t.discount, t.rating, t.overview, t.slider_images, t.thumb_images,
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

/// Binds every editable column in the order $2..$18 used by the INSERT and UPDATE below.
/// (The old duration / activity_type / active_days / travelers / price / video_id columns are no longer
/// edited or shown; they keep their old values in the table.)
macro_rules! bind_tour {
    ($query:expr, $t:expr) => {
        $query
            .bind(&$t.title)
            .bind(&$t.headline)
            .bind(&$t.card_image)
            .bind(&$t.location)
            .bind($t.discount)
            .bind($t.rating)
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
            "INSERT INTO tours (slug, title, headline, card_image, location, discount, rating, overview, slider_images,
                 thumb_images, highlights, included, excluded, faqs, map_embed_url, is_featured, is_published, sort_order)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
            "UPDATE tours SET title = $2, headline = $3, card_image = $4, location = $5, discount = $6, rating = $7,
                 overview = $8, slider_images = $9, thumb_images = $10, highlights = $11, included = $12, excluded = $13,
                 faqs = $14, map_embed_url = $15, is_featured = $16, is_published = $17, sort_order = $18,
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
        .route("/public/tour-reviews", web::get().to(list_public_reviews_handler))
        .route("/public/tour-locations", web::get().to(list_locations_handler))
        .route("/public/tours/{slug}/booking", web::post().to(create_booking_handler))
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
        serde_json::from_value(json!({ "title": " Burj Khalifa ", "card_image": "https://x.in/a.jpg", "location": " Dubai " })).unwrap()
    }

    #[test]
    fn defaults_and_tidying() {
        let t = validate_tour(tour()).unwrap();
        assert_eq!(t.title, "Burj Khalifa");
        assert_eq!(t.location, "Dubai");
        assert_eq!((t.rating, t.is_published), (5, true));
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
        t.location = "  ".into();
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

    fn booking(from: &str, to: &str, travellers: i32) -> BookingDTO {
        serde_json::from_value(json!({
            "name": " Asha ", "email": "Asha@Example.com", "phone": "+91 98765 43210",
            "departure_address": " Jaipur, Rajasthan, India ", "from": from, "to": to, "travellers": travellers,
            "includes": ["Hindi/English Speaking Tour Guide", "Unknown", "Airport Pickup & Drop", "Airport Pickup & Drop"],
            "message": " Veg food please "
        }))
        .unwrap()
    }

    #[test]
    fn trip_length_counts_days_and_nights() {
        let d = |s: &str| s.parse().unwrap();
        assert_eq!(trip_length(d("2026-12-10"), d("2026-12-14")), "5 Days, 4 Nights");
        assert_eq!(trip_length(d("2026-12-10"), d("2026-12-11")), "2 Days, 1 Night");
        assert_eq!(trip_length(d("2026-12-10"), d("2026-12-10")), "1 Day");
    }

    #[test]
    fn booking_checks_and_mail_text() {
        let mut ok = booking("2026-12-10", "2026-12-14", 3);
        validate_booking(&mut ok).unwrap();
        assert_eq!((ok.name.as_str(), ok.email.as_str()), ("Asha", "asha@example.com"));
        assert_eq!(ok.includes, vec!["Airport Pickup & Drop", "Hindi/English Speaking Tour Guide"]);
        assert!(validate_booking(&mut booking("2026-12-14", "2026-12-10", 2)).is_err());
        assert!(validate_booking(&mut booking("2026-12-10", "2026-12-14", 0)).is_err());
        let mut no_address = booking("2026-12-10", "2026-12-14", 2);
        no_address.departure_address = " ".into();
        assert!(validate_booking(&mut no_address).is_err());
        let mut bad_phone = booking("2026-12-10", "2026-12-14", 2);
        bad_phone.phone = "12ab".into();
        assert!(validate_booking(&mut bad_phone).is_err());
        let mut no_message = booking("2026-12-10", "2026-12-14", 2);
        no_message.message = String::new();
        assert!(validate_booking(&mut no_message).is_ok());

        let text = booking_text("Burj Khalifa", "https://x/tour/a/", &ok, "now");
        for part in ["Asha", "asha@example.com", "+91 98765 43210", "Jaipur, Rajasthan, India", "Burj Khalifa", "10/12/2026",
                     "14/12/2026", "5 Days, 4 Nights", "Travellers:         3", "  - Airport Pickup & Drop\n  - Hindi/English Speaking Tour Guide", "Veg food please"] {
            assert!(text.contains(part), "missing {part}");
        }
        assert!(!text.contains("WhatsApp (+91"), "no WhatsApp step any more");
    }

    #[test]
    fn paging_defaults_and_caps() {
        let q = |limit, offset| PageQuery { limit, offset, featured: None, status: None, location: None };
        assert_eq!(q(None, None).page(), (15, 0));
        assert_eq!(q(Some(500), Some(-3)).page(), (100, 0));
    }
}
