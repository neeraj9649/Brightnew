//! Admin: move the website's tour and blog images onto the file server (PHP uploader).
//!
//! `POST /admin/media/move-site-images?limit=20` with body `{"skip": [links that failed before]}`
//! (admin only). Each call moves up to `limit` images
//! that are not on the file server yet: it downloads each one, uploads it (stored flat as
//! uploads/<id>.<ext>) and replaces the link in `tours` (card_image, slider_images, thumb_images) and
//! `blog_posts` (cover_image, inner_images). It answers how many images are still left, so the admin
//! page calls it again until `remaining` is 0. Short batches keep every call well inside proxy timeouts.
//! A link that fails (e.g. the image no longer exists) is reported and left unchanged; the page sends it
//! back in `skip` so the next calls move on to the rest. Nothing is deleted.

use std::collections::HashMap;

use actix_web::{
    middleware::from_fn,
    web::{self, ServiceConfig},
};
use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::PgPool;
use uuid::Uuid;

use auth::api::middlewares::jwt_extractor::check_permission_middleware;
use base::{
    error::{internal, ApiError, ApiResponse},
    role,
};
use shared::cloud_storage::php_uploader;

/// True when `url` is a web link (http/https) that does not point at the file server yet.
fn needs_move(url: &str, file_host: &str) -> bool {
    let url = url.trim();
    let Some(rest) = url.strip_prefix("https://").or_else(|| url.strip_prefix("http://")) else { return false };
    let host = rest.split(['/', '?', '#']).next().unwrap_or("").split(':').next().unwrap_or("");
    !host.is_empty() && !host.eq_ignore_ascii_case(file_host)
}

/// A `file.php?id=` link of another uploader host (e.g. the old resource.brightwingstravel.in) points at a
/// file that lives on the file server too (uploaded there, or copied over), so only the host changes.
fn same_file_on_server(url: &str, file_host: &str) -> Option<String> {
    let url = url.trim();
    let rest = url.strip_prefix("https://").or_else(|| url.strip_prefix("http://"))?;
    let (_, path) = rest.split_once('/')?;
    path.starts_with("file.php?id=").then(|| format!("https://{file_host}/{path}"))
}

/// Every image link of every tour and blog post, as (table, row id, links).
struct Row {
    table: &'static str,
    id: Uuid,
    single: String,       // card_image / cover_image
    lists: Vec<Vec<String>>, // tours: [slider_images, thumb_images]; blog: [inner_images]
}

async fn load_rows(pool: &PgPool) -> Result<Vec<Row>, ApiError> {
    let tours: Vec<(Uuid, String, Vec<String>, Vec<String>)> =
        sqlx::query_as("SELECT id, card_image, slider_images, thumb_images FROM tours ORDER BY created_at")
            .fetch_all(pool)
            .await
            .map_err(internal)?;
    let posts: Vec<(Uuid, String, Vec<String>)> =
        sqlx::query_as("SELECT id, cover_image, inner_images FROM blog_posts ORDER BY created_at")
            .fetch_all(pool)
            .await
            .map_err(internal)?;
    Ok(tours
        .into_iter()
        .map(|(id, single, slider, thumbs)| Row { table: "tours", id, single, lists: vec![slider, thumbs] })
        .chain(posts.into_iter().map(|(id, single, inner)| Row { table: "blog_posts", id, single, lists: vec![inner] }))
        .collect())
}

/// Distinct links still to move, in a stable order.
fn pending_links(rows: &[Row], file_host: &str) -> Vec<String> {
    let mut seen = Vec::new();
    for row in rows {
        for url in std::iter::once(&row.single).chain(row.lists.iter().flatten()) {
            if needs_move(url, file_host) && !seen.contains(url) {
                seen.push(url.clone());
            }
        }
    }
    seen
}

#[derive(Debug, Deserialize)]
pub struct MoveQuery {
    #[serde(default)]
    pub limit: Option<usize>,
}

#[derive(Debug, Deserialize, Default)]
pub struct MoveBody {
    /// Links that failed on an earlier call; left as they are so the run can finish.
    #[serde(default)]
    pub skip: Vec<String>,
}

async fn move_site_images_handler(
    pool: web::Data<PgPool>,
    query: web::Query<MoveQuery>,
    body: Option<web::Json<MoveBody>>,
) -> Result<ApiResponse<Value>, ApiError> {
    let skip = body.map(|b| b.into_inner().skip).unwrap_or_default();
    let file_host = php_uploader::uploader_host()
        .ok_or_else(|| ApiError::new("The file server is not configured (PHP_UPLOADER_BASE_URL)", 500))?;
    let limit = query.limit.unwrap_or(20).clamp(1, 50);
    let rows = load_rows(pool.get_ref()).await?;
    let pending: Vec<String> = pending_links(&rows, &file_host).into_iter().filter(|u| !skip.contains(u)).collect();

    // Move this batch. A failed link is skipped this run and reported.
    let mut moved: HashMap<String, String> = HashMap::new();
    let mut failed: Vec<Value> = Vec::new();
    for old in pending.iter().take(limit) {
        if let Some(new) = same_file_on_server(old, &file_host) {
            moved.insert(old.clone(), new);
            continue;
        }
        match php_uploader::upload_external_file_to_php_uploader_if_needed(old, "site-images", "admin").await {
            Ok(file) => match file.public_url() {
                Ok(new) => {
                    moved.insert(old.clone(), new);
                }
                Err(e) => failed.push(json!({ "url": old, "error": e })),
            },
            Err(e) => {
                log::error!("moving image {old} failed: {e}");
                failed.push(json!({ "url": old, "error": "Could not copy this image" }));
            }
        }
    }

    // Rewrite every row that used a moved link.
    let swap = |u: &String| moved.get(u).cloned().unwrap_or_else(|| u.clone());
    for row in &rows {
        let single = swap(&row.single);
        let lists: Vec<Vec<String>> = row.lists.iter().map(|l| l.iter().map(swap).collect()).collect();
        if single == row.single && lists == row.lists {
            continue;
        }
        let stmt = if row.table == "tours" {
            sqlx::query("UPDATE tours SET card_image = $2, slider_images = $3, thumb_images = $4, updated_at = NOW() WHERE id = $1")
                .bind(row.id)
                .bind(&single)
                .bind(&lists[0])
                .bind(&lists[1])
        } else {
            sqlx::query("UPDATE blog_posts SET cover_image = $2, inner_images = $3, updated_at = NOW() WHERE id = $1")
                .bind(row.id)
                .bind(&single)
                .bind(&lists[0])
        };
        stmt.execute(pool.get_ref()).await.map_err(internal)?;
    }

    // Links still to move after this call (this call's failures are not counted: the page skips them next).
    let remaining = pending.len() - moved.len() - failed.len();
    Ok(ApiResponse(json!({ "moved": moved.len(), "failed": failed, "remaining": remaining, "file_host": file_host })))
}

pub fn media_routes(cfg: &mut ServiceConfig) {
    cfg.service(
        web::scope("/admin/media")
            .wrap(from_fn(|req, next| async move {
                check_permission_middleware(req, next, role::ADMIN_ONLY).await
            }))
            .route("/move-site-images", web::post().to(move_site_images_handler)),
    );
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn only_links_off_the_file_server_move() {
        let host = "resources.brightwingstravel.com";
        assert!(needs_move("https://brightwingstravel.in/images/blog/blog-1-1.jpg", host));
        assert!(!needs_move("https://resources.brightwingstravel.com/uploads/a.jpg", host));
        assert!(!needs_move("https://RESOURCES.brightwingstravel.com/uploads/a.jpg", host));
        assert!(!needs_move("/images/local.jpg", host));
        assert!(!needs_move("", host));
        assert!(needs_move("http://brightwingstravel.com:8080/x.png", host));
        assert!(!needs_move("https://resources.brightwingstravel.com:443/uploads/a.jpg", host));
    }

    #[test]
    fn old_uploader_links_only_change_host() {
        let host = "resources.brightwingstravel.com";
        assert_eq!(
            same_file_on_server("https://resource.brightwingstravel.in/file.php?id=96892dab-2621-487f-9a9c-864164c55632", host).as_deref(),
            Some("https://resources.brightwingstravel.com/file.php?id=96892dab-2621-487f-9a9c-864164c55632")
        );
        assert_eq!(same_file_on_server("https://brightwingstravel.in/images/blog/a.jpg", host), None);
    }

    #[test]
    fn pending_links_are_distinct() {
        let row = |single: &str, list: &[&str]| Row {
            table: "tours",
            id: Uuid::nil(),
            single: single.into(),
            lists: vec![list.iter().map(|s| s.to_string()).collect(), vec![]],
        };
        let rows = vec![
            row("https://site/a.jpg", &["https://site/b.jpg", "https://files/x.jpg"]),
            row("https://site/a.jpg", &["https://site/c.jpg"]),
        ];
        assert_eq!(pending_links(&rows, "files"), vec!["https://site/a.jpg", "https://site/b.jpg", "https://site/c.jpg"]);
    }
}
