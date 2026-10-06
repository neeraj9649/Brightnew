# bp

Build the backend from this directory:

```sh
cargo build --locked --release
```

SQLx query macros use the checked-in `.sqlx/` metadata, with offline mode
enabled in `.cargo/config.toml`. Builds do not need a database connection.
The running backend still requires `DATABASE_URL` and its other environment
settings.

After changing SQL queries or migrations, refresh the cache against a local
development database with all migrations applied:

```sh
cargo sqlx migrate run --database-url "$DATABASE_URL"
SQLX_OFFLINE=false cargo sqlx prepare --workspace --all -- --all-targets --all-features --locked
```

Commit the resulting `.sqlx/` files alongside the query or migration changes.
To verify the cache against that database:

```sh
SQLX_OFFLINE=false cargo sqlx prepare --check --workspace --all -- --all-targets --all-features --locked
```
