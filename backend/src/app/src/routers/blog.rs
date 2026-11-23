//! Website blog (Go_Travel_Brightwings site) and its comments. Tables from migration 0037.
//!
//! Public, no sign-in:
//!   GET  /public/blog                      published posts, newest first
//!   GET  /public/blog/{slug}               one published post + its approved comments
//!   POST /public/blog/{slug}/comments      new comment, saved as `pending`
//! Admin only (`/admin/blog`):
//!   GET  /posts, POST /posts, PUT /posts/{id}      write and edit posts (hide = is_published false)
//!   GET  /comments?status=pending, PUT /comments/{id}   approve or reject comments
//!
//! Nothing is ever deleted: posts are hidden and comments are rejected instead.

use std::time::Duration;

use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
    HttpRequest,
};
use chrono::NaiveDate;
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

use super::enquiries::plausible_email;

/// Comments one IP address may post per hour.
const COMMENTS_PER_HOUR: u32 = 5;

// ---------------------------------------------------------------------------
// Public
// ---------------------------------------------------------------------------

async fn list_public_handler(pool: web::Data<PgPool>) -> Result<ApiResponse<Value>, ApiError> {
    let rows: Value = sqlx::query_scalar(
        "SELECT COALESCE(json_agg(t ORDER BY t.published_on DESC, t.created_at DESC), '[]'::json) FROM (
             SELECT p.slug, p.title, p.published_on, p.cover_image, p.created_at,
                    (SELECT COUNT(*) FROM blog_comments c WHERE c.post_id = p.id AND c.status = 'approved') AS comment_count
             FROM blog_posts p WHERE p.is_published
         ) t",
    )
    .fetch_one(pool.get_ref())
    .await
    .map_err(internal)?;
    Ok(ApiResponse(rows))
}

async fn get_public_handler(pool: web::Data<PgPool>, slug: web::Path<String>) -> Result<ApiResponse<Value>, ApiError> {
    let post: Option<Value> = sqlx::query_scalar(
        "SELECT json_build_object(
             'slug', p.slug, 'title', p.title, 'published_on', p.published_on, 'cover_image', p.cover_image,
             'content', p.content, 'inner_images', p.inner_images, 'inner_text', p.inner_text,
             'quote', p.quote, 'closing_text', p.closing_text, 'tags', p.tags,
             'comments', COALESCE((
                 SELECT json_agg(json_build_object('name', c.name, 'message', c.message, 'created_at', c.created_at) ORDER BY c.created_at)
                 FROM blog_comments c WHERE c.post_id = p.id AND c.status = 'approved'
             ), '[]'::json))
         FROM blog_posts p WHERE p.slug = $1 AND p.is_published",
    )
    .bind(slug.as_str())
    .fetch_optional(pool.get_ref())
    .await
    .map_err(internal)?;
    post.map(ApiResponse).ok_or_else(|| ApiError::new("This blog post was not found", 404))
}

#[derive(Debug, Deserialize)]
pub struct CommentDTO {
    pub name: String,
    pub email: String,
    pub message: String,
}

/// Checks a visitor's comment; returns (name, email, message) tidied. Messages are shown to the visitor.
fn validate_comment(body: CommentDTO) -> Result<(String, String, String), ApiError> {
    let name = body.name.trim().to_string();
    if name.is_empty() || name.chars().count() > 100 || name.chars().any(char::is_control) {
        return Err(ApiError::new("Please enter your name", 400));
    }
    let email = body.email.trim().to_lowercase();
    if email.len() > 200 || !plausible_email(&email) {
        return Err(ApiError::new("Please enter a valid e-mail address", 400));
    }
    let message = body.message.trim().to_string();
    if message.is_empty() {
        return Err(ApiError::new("Please write a comment", 400));
    }
    if message.chars().count() > 2000 {
        return Err(ApiError::new("Your comment is too long. Please keep it under 2000 characters.", 400));
    }
    Ok((name, email, message))
}

async fn create_comment_handler(
    pool: web::Data<PgPool>,
    req: HttpRequest,
    slug: web::Path<String>,
    body: web::Json<CommentDTO>,
) -> Result<ApiResponse<Value>, ApiError> {
    let (name, email, message) = validate_comment(body.into_inner())?;
    let post_id: Option<Uuid> = sqlx::query_scalar("SELECT id FROM blog_posts WHERE slug = $1 AND is_published")
        .bind(slug.as_str())
        .fetch_optional(pool.get_ref())
        .await
        .map_err(internal)?;
    let post_id = post_id.ok_or_else(|| ApiError::new("This blog post was not found", 404))?;

    let ip = req.connection_info().realip_remote_addr().unwrap_or("unknown").to_string();
    base::rate_limit::LIMITER.hit(&format!("blog-comment:{ip}"), COMMENTS_PER_HOUR, Duration::from_secs(60 * 60))?;

    sqlx::query("INSERT INTO blog_comments (post_id, name, email, message, ip_address) VALUES ($1, $2, $3, $4, $5)")
        .bind(post_id)
        .bind(&name)
        .bind(&email)
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

#[derive(Debug, Deserialize)]
pub struct PostDTO {
    pub title: String,
    #[serde(default)]
    pub published_on: Option<NaiveDate>,
    pub cover_image: String,
    #[serde(default)]
    pub content: String,
    #[serde(default)]
    pub inner_images: Vec<String>,
    #[serde(default)]
    pub inner_text: String,
    #[serde(default)]
    pub quote: String,
    #[serde(default)]
    pub closing_text: String,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default = "yes")]
    pub is_published: bool,
}

fn yes() -> bool {
    true
}

fn is_image_url(url: &str) -> bool {
    (url.starts_with("https://") || url.starts_with("http://")) && url.len() <= 1000 && !url.chars().any(|c| c.is_whitespace())
}

/// Checks and tidies a post from the admin form.
fn validate_post(mut p: PostDTO) -> Result<PostDTO, ApiError> {
    p.title = p.title.trim().to_string();
    if p.title.is_empty() || p.title.chars().count() > 200 {
        return Err(ApiError::new("Give the post a title (up to 200 characters)", 400));
    }
    p.cover_image = p.cover_image.trim().to_string();
    if !is_image_url(&p.cover_image) {
        return Err(ApiError::new("Upload a cover image", 400));
    }
    p.inner_images = p.inner_images.iter().map(|u| u.trim().to_string()).filter(|u| !u.is_empty()).collect();
    if p.inner_images.len() > 2 || !p.inner_images.iter().all(|u| is_image_url(u)) {
        return Err(ApiError::new("Add up to 2 inner images", 400));
    }
    for text in [&mut p.content, &mut p.inner_text, &mut p.quote, &mut p.closing_text] {
        *text = text.trim().to_string();
        if text.chars().count() > 20_000 {
            return Err(ApiError::new("A text section is too long (over 20000 characters)", 400));
        }
    }
    p.tags = p.tags.iter().map(|t| t.trim().to_string()).filter(|t| !t.is_empty()).collect();
    if p.tags.len() > 10 || p.tags.iter().any(|t| t.chars().count() > 40) {
        return Err(ApiError::new("Use up to 10 tags of up to 40 characters", 400));
    }
    Ok(p)
}

/// "Sakura Dreams & Tales!" -> "sakura-dreams-tales".
fn slugify(title: &str) -> String {
    let mut slug = String::new();
    for c in title.to_lowercase().chars() {
        if c.is_ascii_alphanumeric() {
            slug.push(c);
        } else if !slug.ends_with('-') && !slug.is_empty() {
            slug.push('-');
        }
    }
    let slug: String = slug.trim_end_matches('-').chars().take(140).collect();
    let slug = slug.trim_end_matches('-').to_string();
    if slug.is_empty() { "post".to_string() } else { slug }
}

const ADMIN_POST_COLUMNS: &str = "p.id, p.slug, p.title, p.published_on, p.cover_image, p.content, p.inner_images, p.inner_text,
     p.quote, p.closing_text, p.tags, p.is_published, p.created_at, p.updated_at,
     (SELECT COUNT(*) FROM blog_comments c WHERE c.post_id = p.id AND c.status = 'pending') AS pending_comments";

async fn admin_post_json(pool: &PgPool, id: Uuid) -> Result<Value, ApiError> {
    sqlx::query_scalar::<_, Value>(&format!("SELECT row_to_json(t) FROM (SELECT {ADMIN_POST_COLUMNS} FROM blog_posts p WHERE p.id = $1) t"))
        .bind(id)
        .fetch_optional(pool)
        .await
        .map_err(internal)?
        .ok_or_else(|| ApiError::new("This blog post was not found", 404))
}

async fn list_admin_posts_handler(pool: web::Data<PgPool>) -> Result<ApiResponse<Value>, ApiError> {
    let rows: Value = sqlx::query_scalar(&format!(
        "SELECT COALESCE(json_agg(t ORDER BY t.published_on DESC, t.created_at DESC), '[]'::json)
         FROM (SELECT {ADMIN_POST_COLUMNS} FROM blog_posts p) t"
    ))
    .fetch_one(pool.get_ref())
    .await
    .map_err(internal)?;
    Ok(ApiResponse(rows))
}

async fn create_post_handler(pool: web::Data<PgPool>, body: web::Json<PostDTO>) -> Result<ApiResponse<Value>, ApiError> {
    let p = validate_post(body.into_inner())?;
    let base = slugify(&p.title);
    // First free slug: "title", then "title-2", "title-3", ...
    let taken: Vec<String> = sqlx::query_scalar("SELECT slug FROM blog_posts WHERE slug = $1 OR slug LIKE $1 || '-%'")
        .bind(&base)
        .fetch_all(pool.get_ref())
        .await
        .map_err(internal)?;
    let slug = (1..)
        .map(|n| if n == 1 { base.clone() } else { format!("{base}-{n}") })
        .find(|s| !taken.contains(s))
        .expect("an unused slug always exists");

    let id: Uuid = sqlx::query_scalar(
        "INSERT INTO blog_posts (slug, title, published_on, cover_image, content, inner_images, inner_text, quote, closing_text, tags, is_published)
         VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id",
    )
    .bind(&slug)
    .bind(&p.title)
    .bind(p.published_on)
    .bind(&p.cover_image)
    .bind(&p.content)
    .bind(&p.inner_images)
    .bind(&p.inner_text)
    .bind(&p.quote)
    .bind(&p.closing_text)
    .bind(&p.tags)
    .bind(p.is_published)
    .fetch_one(pool.get_ref())
    .await
    .map_err(internal)?;
    Ok(ApiResponse(admin_post_json(pool.get_ref(), id).await?))
}

async fn update_post_handler(
    pool: web::Data<PgPool>,
    id: web::Path<Uuid>,
    body: web::Json<PostDTO>,
) -> Result<ApiResponse<Value>, ApiError> {
    let p = validate_post(body.into_inner())?;
    // The slug stays the same on edit so links people already shared keep working.
    let updated = sqlx::query(
        "UPDATE blog_posts SET title = $2, published_on = COALESCE($3, published_on), cover_image = $4, content = $5,
             inner_images = $6, inner_text = $7, quote = $8, closing_text = $9, tags = $10, is_published = $11, updated_at = NOW()
         WHERE id = $1",
    )
    .bind(*id)
    .bind(&p.title)
    .bind(p.published_on)
    .bind(&p.cover_image)
    .bind(&p.content)
    .bind(&p.inner_images)
    .bind(&p.inner_text)
    .bind(&p.quote)
    .bind(&p.closing_text)
    .bind(&p.tags)
    .bind(p.is_published)
    .execute(pool.get_ref())
    .await
    .map_err(internal)?;
    if updated.rows_affected() == 0 {
        return Err(ApiError::new("This blog post was not found", 404));
    }
    Ok(ApiResponse(admin_post_json(pool.get_ref(), *id).await?))
}

#[derive(Debug, Deserialize)]
pub struct CommentsQuery {
    #[serde(default)]
    pub status: Option<String>,
}

async fn list_comments_handler(pool: web::Data<PgPool>, query: web::Query<CommentsQuery>) -> Result<ApiResponse<Value>, ApiError> {
    let status = query.status.clone().unwrap_or_else(|| "pending".to_string());
    if !["pending", "approved", "rejected"].contains(&status.as_str()) {
        return Err(ApiError::new("Unknown comment status", 400));
    }
    // ponytail: newest 200 only, add paging if moderation ever falls that far behind.
    let rows: Value = sqlx::query_scalar(
        "SELECT COALESCE(json_agg(t ORDER BY t.created_at DESC), '[]'::json) FROM (
             SELECT c.id, c.name, c.email, c.message, c.status, c.created_at, c.reviewed_at,
                    p.id AS post_id, p.slug AS post_slug, p.title AS post_title
             FROM blog_comments c JOIN blog_posts p ON p.id = c.post_id
             WHERE c.status = $1 ORDER BY c.created_at DESC LIMIT 200
         ) t",
    )
    .bind(&status)
    .fetch_one(pool.get_ref())
    .await
    .map_err(internal)?;
    Ok(ApiResponse(rows))
}

#[derive(Debug, Deserialize)]
pub struct ReviewDTO {
    pub status: String,
}

async fn review_comment_handler(
    pool: web::Data<PgPool>,
    claims: JwtClaims,
    id: web::Path<Uuid>,
    body: web::Json<ReviewDTO>,
) -> Result<ApiResponse<Value>, ApiError> {
    if !["approved", "rejected"].contains(&body.status.as_str()) {
        return Err(ApiError::new("Choose approve or reject", 400));
    }
    let updated = sqlx::query("UPDATE blog_comments SET status = $2, reviewed_by = $3, reviewed_at = NOW() WHERE id = $1")
        .bind(*id)
        .bind(&body.status)
        .bind(claims.sub)
        .execute(pool.get_ref())
        .await
        .map_err(internal)?;
    if updated.rows_affected() == 0 {
        return Err(ApiError::new("This comment was not found", 404));
    }
    Ok(ApiResponse(json!({ "id": *id, "status": body.status })))
}

pub fn blog_routes(cfg: &mut ServiceConfig) {
    // Plain routes, not a `/public` scope: other /public/* routes live in portal.rs and enquiries.rs,
    // and actix scopes do not fall through.
    cfg.route("/public/blog", web::get().to(list_public_handler))
        .route("/public/blog/{slug}", web::get().to(get_public_handler))
        .route("/public/blog/{slug}/comments", web::post().to(create_comment_handler))
        .service(
            web::scope("/admin/blog")
                .wrap(from_fn(|req, next| async move {
                    check_permission_middleware(req, next, role::ADMIN_ONLY).await
                }))
                .route("/posts", web::get().to(list_admin_posts_handler))
                .route("/posts", web::post().to(create_post_handler))
                .route("/posts/{id}", web::put().to(update_post_handler))
                .route("/comments", web::get().to(list_comments_handler))
                .route("/comments/{id}", web::put().to(review_comment_handler)),
        );
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn slugify_makes_clean_links() {
        assert_eq!(slugify("Sakura Dreams And Samurai Tales."), "sakura-dreams-and-samurai-tales");
        assert_eq!(slugify("  Dubai — 5 nights & more!! "), "dubai-5-nights-more");
        assert_eq!(slugify("!!!"), "post");
    }

    #[test]
    fn comment_validation() {
        let c = |n: &str, e: &str, m: &str| CommentDTO { name: n.into(), email: e.into(), message: m.into() };
        assert!(validate_comment(c("Asha", "Asha@Example.com", " Nice ")).is_ok());
        assert!(validate_comment(c("", "a@b.co", "hi")).is_err());
        assert!(validate_comment(c("A", "nope", "hi")).is_err());
        assert!(validate_comment(c("A", "a@b.co", "  ")).is_err());
    }

    #[test]
    fn post_validation() {
        let post = |cover: &str, images: Vec<&str>| PostDTO {
            title: " Title ".into(),
            published_on: None,
            cover_image: cover.into(),
            content: String::new(),
            inner_images: images.into_iter().map(String::from).collect(),
            inner_text: String::new(),
            quote: String::new(),
            closing_text: String::new(),
            tags: vec![" Travel ".into(), "".into()],
            is_published: true,
        };
        let ok = validate_post(post("https://x.in/a.jpg", vec![])).unwrap();
        assert_eq!(ok.title, "Title");
        assert_eq!(ok.tags, vec!["Travel"]);
        assert!(validate_post(post("", vec![])).is_err());
        assert!(validate_post(post("https://x.in/a.jpg", vec!["https://x.in/1.jpg", "https://x.in/2.jpg", "https://x.in/3.jpg"])).is_err());
    }
}
