# bp — Bright Wings backend

Actix-web + SQLx (Postgres) workspace. Modules live in `src/modules/*`, HTTP
wiring in `src/app`.

## Build

```sh
cargo build --locked --release
```

SQLx `query!` macros are compiled from the checked-in `.sqlx/` metadata
(offline mode is enabled in `.cargo/config.toml`), so **builds do not need a
database**. The running server still needs `DATABASE_URL` and the settings
below. Migrations in `migrations/` run automatically on start-up.

### After changing a SQL query or migration

The offline cache must be regenerated against a database with every migration
applied, then committed together with the change:

```sh
createdb bp_scratch
for f in migrations/*.sql; do psql bp_scratch -v ON_ERROR_STOP=1 -q -f "$f"; done
rm -rf .sqlx && mkdir .sqlx
find src -name '*.rs' -exec touch {} +          # force every macro to re-expand
DATABASE_URL=postgresql:///bp_scratch SQLX_OFFLINE=false \
  SQLX_OFFLINE_DIR="$PWD/.sqlx" cargo build --workspace --all-targets
dropdb bp_scratch
```

Then verify the cache is complete with `cargo build --locked` and no
`DATABASE_URL`.

User queries select columns explicitly because databases upgraded from older
releases can have a different physical column order. Run the regression check
against a disposable Postgres database (it uses temporary tables):

```sh
TEST_DATABASE_URL=postgresql:///bp_scratch \
  cargo test -p auth --test user_column_order -- --ignored
```

## Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL`, `ADDRESS`, `PORT` | yes | Postgres and listen address |
| `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `PASSWORD_HASH_SECRET` | yes | Token/PIN hashing secrets |
| `CORS_ALLOWED_ORIGIN` | yes | Comma-separated portal origins (e.g. `https://portal.brightwingstravel.com`) |
| `PHP_UPLOADER_BASE_URL`, `PHP_UPLOADER_TOKEN` | yes | File uploads (profile images, documents) |
| `SMS_WEBHOOK_URL` | for PIN-reset SMS | Gateway receiving `POST {"to","message"}`; optional `SMS_WEBHOOK_TOKEN` is sent as a bearer token |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_ADDRESS` | optional | E-mail fallback for PIN codes and welcome mails |
| `PORTAL_URL` | optional | Used in the "set your PIN" invitation sent to staff-created accounts |
| `SUPPORT_PHONE` | optional | Company line shown behind the **Call** button on booking details |
| `ENABLE_APP_CORS=true` | optional | Turns on the API's own CORS layer (off by default; leave off when your reverse proxy already sends CORS headers, otherwise browsers see duplicate headers) |
| `OTP_DEV_ECHO=true` | **never in production** | Returns the PIN-reset code in the API response for local testing |

PIN-reset codes are delivered by the SMS gateway, falling back to e-mail, and
finally to a server log warning. If neither SMS nor SMTP is configured, members
cannot recover a PIN by themselves — configure at least one before go-live.

## Releases

The set of migrations is append-only. `0021_portal_v3.sql` and
`0022_staff_workspace.sql` add PIN recovery, preferences, structured
quotations, the booking activity feed, richer rewards/redemptions and task
priorities. `0024_desktop_portal.sql` adds reward tier gating and
destinations, the partner-offers preference, advisor/customer booking
messages and e-mail referral invites for the desktop portal. Deploy the backend **before** publishing the matching portal build.
