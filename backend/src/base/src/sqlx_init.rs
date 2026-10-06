use crate::constants;
use dotenv::dotenv;
use sqlx::PgPool;

pub async fn db_conn() -> PgPool {
    dotenv().ok();
    let database_url = constants::DATABASE_URL.clone();
    let pool = PgPool::connect(&database_url)
        .await
        .expect("unable to create sqlx db pool");

    // Start-up must prepare a fresh database before the first request. SQLx
    // skips migrations that have already been applied.
    // The macro resolves paths from this crate's Cargo.toml directory
    // (`backend/src/base`), not from this source file.
    sqlx::migrate!("../../migrations")
        .run(&pool)
        .await
        .expect("unable to run database migrations");

    pool
}
