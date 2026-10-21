use actix_web::HttpServer;
use app::{container::Container, create_app::create_app};
use base::{constants, log_config::config_logger};
use std::sync::Arc;
#[actix_web::main]
async fn main() -> std::io::Result<()> {
    config_logger();

    let port = *constants::PORT;
    let address = (*constants::ADDRESS).clone();

    let container = Arc::new(Container::new().await);
    app::bootstrap::promote_super_admins(&container.sqlx_pool).await;
    app::bootstrap::spawn_refresh_token_cleanup(container.sqlx_pool.clone());
    let server = HttpServer::new(move || create_app(container.clone())).bind((address, port))?;
    server.run().await
}
