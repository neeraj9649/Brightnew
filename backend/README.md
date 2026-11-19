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
| `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `PASSWORD_HASH_SECRET` | yes | Token and code hashing secrets |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` | **yes, for sign-in** | Twilio Verify sends the 4-digit sign-in / join code by SMS. Set the Verify Service code length to 4 in the Twilio Console |
| `CORS_ALLOWED_ORIGIN` | yes | Comma-separated portal origins (e.g. `https://portal.brightwingstravel.com`) |
| `PHP_UPLOADER_BASE_URL`, `PHP_UPLOADER_TOKEN` | yes | File uploads (profile images, documents) |
| `SMS_WEBHOOK_URL` | optional | Welcome SMS for staff-created accounts. | Gateway receiving `POST {"to","message"}`; optional `SMS_WEBHOOK_TOKEN` is sent as a bearer token |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_ADDRESS` | optional | E-mail fallback for sign-in codes and welcome mails |
| `PORTAL_URL` | optional | Sign-in link in the welcome message sent to staff-created accounts |
| `SUPPORT_PHONE` | optional | Company line shown behind the **Call** button on booking details |
| `ENABLE_APP_CORS=true` | optional | Turns on the API's own CORS layer (off by default; leave off when your reverse proxy already sends CORS headers, otherwise browsers see duplicate headers) |
| `OTP_DEV_ECHO=true` | **never in production** | Returns the sign-in code in the API response for local testing |

Everyone signs in with their phone number and a 4-digit passcode. A 6-digit SMS code is used
only to confirm the phone when joining and for *Forgot passcode*. Codes go out through Twilio
Verify; if that fails and the account has an e-mail address, a code is e-mailed instead.
**Without Twilio nobody can join or reset a passcode.**

## Releases

The set of migrations is append-only. `0021_portal_v3.sql` and
`0022_staff_workspace.sql` add PIN recovery, preferences, structured
quotations, the booking activity feed, richer rewards/redemptions and task
priorities. `0024_desktop_portal.sql` adds reward tier gating and
destinations, the partner-offers preference, advisor/customer booking
messages and e-mail referral invites for the desktop portal. Deploy the backend **before** publishing the matching portal build.

## Super admin

`super_admin` (migration `0025_super_admin_role.sql`) can do everything an admin can,
and is the only role that can promote/demote admins and staff or deactivate admin
accounts. Nobody can change their own role or deactivate themselves. Sign-in is phone +
passcode like every other account. Register the number on the portal's *Join* page
first, then promote it:

```sh
DATABASE_URL=postgres://... backend/scripts/make_super_admin.sh 9649863232
```

To avoid needing database access, set `SUPER_ADMIN_PHONES=9649863232` (comma-separated) on the backend:
at every start it promotes those already-registered accounts to `super_admin`. It never creates or
demotes anyone.

## Phone numbers

Members can sign up with a mobile number from any country. Numbers are stored in one canonical
form so nobody gets two accounts: Indian numbers stay the bare 10 digits (every existing account),
numbers from other countries are E.164 with a leading `+` (e.g. `+14155552671`). The API accepts
either form and normalises it (`+91 98765 43210` and `9876543210` are the same person). SMS gateways
receive that stored form in `to` — prepend `+91` to 10-digit values if your provider needs E.164.

## File uploads

The PHP upload service from mship is included in [`php_uploader/`](php_uploader/README.md).
Deploy that directory on your PHP host and configure `PHP_UPLOADER_BASE_URL`
and `PHP_UPLOADER_TOKEN` on the Rust API. Set the same token in the PHP service's
`config.local.php` or environment. `PHP_UPLOADER_UPLOAD_URL` can override the
upload endpoint; `PHP_UPLOADER_BASE_URL` still supplies download URLs.

Send an authenticated multipart POST with exactly one `file` field (nonempty,
maximum 10 MiB). The default PHP configuration accepts jpg, jpeg, png, gif,
webp, pdf, doc and docx. Configure PHP's `upload_max_filesize` and `post_max_size`
and your reverse proxy's body limit to allow 10 MiB plus multipart overhead.

| Route | Access | Save the returned `file_id` in |
| --- | --- | --- |
| `/uploads/profile-image` | Any signed-in user | Profile `profile_image_file_id` |
| `/uploads/booking-document` | Any signed-in user | Booking document `file_id` |
| `/uploads/visa-document` | Any signed-in user | Booking document `file_id` |
| `/uploads/quotation` | Employee, admin, super admin | Quotation `file_id` |
| `/uploads/expense-receipt` | Employee, admin, super admin | Booking expense `file_id` |
| `/uploads/support-attachment` | Any signed-in user | Support ticket `attachments` array |
| `/uploads/reward-image` | Admin, super admin | Reward item `image_file_id` |

```sh
curl -X POST "$API_URL/uploads/booking-document" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "file=@ticket.pdf"
```

The response uses the standard API envelope:
`{"data":{"file_id":"<uuid>","url":"https://<resource-host>/file.php?id=<uuid>"},"msg":"","success":true,"statusCode":200}`.
Uploads return a file reference; use the existing profile, document, quotation,
expense, ticket or reward API to attach it to a record. Download URLs are public,
matching mship's retrieval service. The uploader uses HTTP/1.1 and mship's
Hostinger-compatible request headers, with a 10-second connection timeout and
60-second request timeout.
