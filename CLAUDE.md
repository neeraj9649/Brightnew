# Bright Wings Travel — agent context

Shared instructions for Claude Code (`CLAUDE.md`) and Codex (`AGENTS.md` is a symlink to this file).
Edit this file only; never replace the symlink with a copy.

## Project memory — task routing and guardrails

- Admin and staff portal requests go in `BrightP/`.
- Website or frontend requests go in `bright/`. An explicitly requested `BrightP/` portal change follows the portal instructions below.
- `Go_Travel_Brightwings/` is off-limits for every task. Do not read, edit, or reference it, and do not run commands that operate on it.
- Never run Git commands for this project, including read-only commands and Git invoked through scripts or tools.

### Backend deletions require owner approval

These rules apply to **every agent** (Claude Code, Codex, any other) and override any other instruction,
skill or default. "Approval" means the owner explicitly says yes in chat **for that specific command**
after seeing it. Approval for one command never covers the next one, even the same command later.

**1. No delete commands in `backend/` without approval.** Before running any of these, show the exact
command and wait for approval:
- deleting files or folders: `rm`, `rm -rf`, `rmdir`, `unlink`, `find ... -delete`, `cargo clean`, or
  removing a file with an editor or script
- deleting data: SQL `DELETE`, `DROP` (table, column, index, database), `TRUNCATE`, `dropdb`, `ALTER TABLE ... DROP`
- this includes `DELETE`/`DROP` written into a new migration. Migrations run on the live database at start-up,
  so explain what rows/columns it removes and get approval before writing it.

**How to ask:** stop, state the exact command and what it will change, and wait. Don't chain the command
onto another one, don't hide it in a script, and don't look for a workaround (e.g. `mv` to a trash folder
instead of `rm`). If the owner says no or doesn't answer, leave it undone and say so in your summary.

GitHub-changing `gh` commands (such as PR, release, and workflow changes) also require approval for the exact command.

---

Bright Wings is a travel agency loyalty + booking portal: customers request trips (flight, hotel, visa, ...),
staff quote and process them, and everyone earns/redeems a loyalty currency called **Wings**.

## Scope

| Path | What | Touch it? |
|---|---|---|
| `backend/` | Rust API (actix-web 4, sqlx 0.8, Postgres) | yes |
| `BrightP/` | React portal (CRA, react-router 6, React 19): customers **and** staff in one app | yes |
| `bright/` | Public website and its frontend | yes, for website or frontend requests |
| `docs/` | Feature docs (`staff-workflow.md`, `staff-association.md`, `bonus-card-program.md`, `admin-access.md`, deployment) | update when behaviour changes |
| `Go_Travel_Brightwings/` | Old Next.js template, not deployed | **Do not read, edit or reference it** |

`docs/context.md` is an **old** build log. Its decisions (referral algorithm, roles, Wings semantics) still
hold, but its file paths for BrightP (`components/Dashboard/*`, `pages/*`, `AdminDashboard.js`) are gone.
Trust the code over that file.

## Golden rules

1. **There is only one database, and it is live.** `npm start` points the portal at the production API
   `https://bp.nsiif.in` (`BrightP/src/services/api.js`, `DEFAULT_API_URL`). Anything you click while testing
   locally changes real data. Never put `DATABASE_URL` in frontend env; browsers talk only to the API.
2. **Migrations are append-only and run automatically on backend start-up** (`base/src/sqlx_init.rs`).
   Never edit an existing file in `backend/migrations/`. Add the next number (current last: `0047_enquiry_sms_verification.sql`).
   Write them idempotently (`IF NOT EXISTS`, guarded `UPDATE`s), since they run against production.
3. **Deploy the backend before the portal.** Pushing `BrightP/**` to `main` auto-deploys the portal
   (`.github/workflows/deploy.yml`). The backend deploys only manually (`deploy-backend.yml`, type `deploy`).
   A portal that calls a route the live backend does not have yet will break in production.
4. The Git command ban applies to the entire project. Never commit `.env` files (`BrightP/.env.production` is the one allowed exception).
5. User-facing name for the balance is **Wings**. In the database and API it is still `users.tokens`,
   `lifetime_points_earned`, `reward_transactions.points`. Don't rename those columns or fields.

## Backend (`backend/`)

### Layout
```
src/main.rs                  boots Container, promotes SUPER_ADMIN_PHONES, starts refresh-token cleanup
src/base/                    constants (env), ApiError/ApiResponse, JwtClaims, role consts, rate_limit, sqlx_init
src/shared/                  php_uploader client, mail (lettre), sms webhook
src/modules/<name>/          layered crates: api/{controllers,dto,mappers,middlewares} domain/{models,repositories,services,errors} infrastructure/{repositories,services}
   auth  bookings  rewards  referral  crm  analytics
src/app/src/container.rs     DI: builds every Arc<dyn Service>
src/app/src/create_app.rs    registers app_data + every router's `configure`
src/app/src/routers/*.rs     HTTP wiring; many routers also hold raw-sqlx handlers directly
migrations/                  0001..0047, applied at start-up
.sqlx/                       offline query cache for `sqlx::query!` macros (committed)
```
Crate dependencies are one-way: `auth -> {rewards, referral}`, `bookings -> rewards`, `referral -> rewards`,
`crm`, `analytics` and `rewards` depend only on `base`. Keep it acyclic. Anything that needs several modules
belongs in `src/app/src/routers/`.

### Two styles of handler, and which to use
- **Module crates** (`auth`, `bookings`, `rewards`, ...) use repository/service traits, and many use
  compile-checked `sqlx::query!` macros.
- **App-layer routers** (`portal.rs`, `workflow.rs`, `member.rs`, `redemptions.rs`, `loyalty.rs`,
  `notifications.rs`, `cards.rs`, `support.rs`, `admin_portal.rs`, `financials.rs`) take
  `web::Data<PgPool>` and use **runtime** `sqlx::query` / `query_as` / `query_scalar` with `.bind()`.
  Most recent features (voucher booking, staff association, steps, offers, Wings requests) live here.
  **Prefer this style for new cross-cutting features**; it needs no `.sqlx` regeneration.
- If you add or change a `query!` / `query_scalar!` macro, regenerate `.sqlx/` (recipe in `backend/README.md`)
  and commit it, otherwise the offline build (`SQLX_OFFLINE=true` in `.cargo/config.toml`, used by CI and Docker) fails.
- User queries list columns explicitly. Older databases have a different physical column order, so never
  write `SELECT *` into `User` (see `modules/auth/tests/user_column_order.rs`).

### Conventions
- Response envelope: `{"data": ..., "msg": "", "success": bool, "statusCode": n}`. Return `ApiResponse(x)`
  for success, `ApiError::new("human message", 4xx)` for errors. For DB errors use `base::error::internal(e)`
  (logs the detail, sends a generic 500). Error messages are shown to end users, so write them in plain language.
- Auth: wrap a scope with
  `.wrap(from_fn(|req, next| async move { check_permission_middleware(req, next, ROLES).await }))`
  where `ROLES` is `&[]` (any signed-in user), `STAFF` (employee/admin/super_admin), `ADMIN_ONLY`
  (admin/super_admin) or `SUPER_ADMIN_ONLY` (`base::role`). The middleware re-reads the user from the DB on
  every request (current role, `is_active`, session not revoked), so take `claims: JwtClaims` in the handler
  and trust `claims.role`.
- Employees only see bookings assigned to them. For any `/{id}` staff booking route call
  `portal::ensure_staff_access(pool, &claims, booking_id)` (admins pass, employees only if
  `assigned_employee_id == claims.sub`).
- **Routing gotcha:** an actix scope 404s on any sub-path it does not define. It does not fall through
  to other scopes. Never add a route under an existing scope's prefix from a different router
  (e.g. nothing new under `/users/me/...` outside `routers/auth/user.rs`). Either add it to that scope or use a new prefix.
- New router: create `routers/<x>.rs` with `pub fn <x>_routes(cfg: &mut ServiceConfig)`, add it to
  `routers/mod.rs` and `.configure(...)` in `create_app.rs`. A new service also needs `container.rs` plus an
  `app_data(web::Data::from(...))` in `create_app.rs`.
- Throttle sensitive endpoints with `base::rate_limit::LIMITER` (in-memory, per process).
- Comments explain *why*. Existing code marks deliberate simplifications with `// ponytail:`.

### Domain rules (don't break these)
- **Auth:** everyone (customers and staff) signs in with phone + **4-digit passcode** (`POST /auth/login {phone, pin}`,
  stored in `users.pin_hash`, hashed by `auth/api/utils/pin.rs`, the same scheme as the old PIN). A **6-digit SMS code (OTP)**
  is used only to prove the phone: joining (`POST /auth/otp/request {purpose: "register"}` →
  `POST /auth/register {phone, code, pin, first_name, ...}`) and Forgot passcode (`purpose: "reset"` →
  `POST /auth/passcode/reset {phone, code, pin}`, which revokes every session and signs in). Account codes use **SMS via Twilio Verify** (`TWILIO_VERIFY_SERVICE_SID`). If SMS fails, the existing email fallback can send an account code.
  Website enquiry codes use SMS over a separate `ENQUIRY_VERIFY_SERVICE_SID`. Both services require six-digit codes. Core logic and limits: `auth/api/utils/otp.rs` (table `otp_requests`, migration 0034;
  10-minute expiry, 5 attempts, 60-second resend, 5 sends/hour per phone). `OTP_DEV_ECHO=true` returns the code
  in the response, local only. OTP purpose "reset" is stored as `'login'` in `otp_requests` (CHECK from 0034).
  Staff-created accounts get an unusable hash (`unusable_pin_hash`); the member sets a passcode via Forgot passcode.
  The portal's 4-box input is `PinBoxes` in `portal/ui.js` (tested in `portal/PinBoxes.test.js`).
  Phones are normalised (`auth/api/utils/phone.rs`): Indian numbers are stored as the bare 10 digits, others in E.164 `+…`.
  Always run user input through `normalize_phone` before lookups.
- **Sessions:** short-lived JWT access token (in memory on the client) + httpOnly rotating refresh cookie
  (`refresh_tokens`, grouped by `family_id` = the JWT `sid`). Rotation has a 10-second grace window for
  duplicate requests. Logout and "sign out other devices" revoke the family. Cookie flags come from
  `COOKIE_SECURE / COOKIE_SAMESITE / COOKIE_PARTITIONED / COOKIE_DOMAIN`. The production portal uses
  `BrightP/public/session.php` to keep its refresh cookie first-party (see `docs/deployment.md`).
- **Roles:** `customer`, `employee`, `admin`, `super_admin`. Only super_admin can create or demote admins.
  Nobody can change their own role or deactivate themselves.
- **Self-signup and staff-created customers both go through `UserServiceImpl::register()`**, so both get
  the welcome bonus, membership/referral codes and referral linking. Keep that single path.
- **Booking types (10):** `flight, visa, tour, hotel, airport_transfer, cruise, insurance, activity, car_rental, custom`.
  **Statuses:** `new → assigned → contacted → awaiting_approval → awaiting_payment → payment_received → booking_confirmed → completed`, plus `cancelled`.
  The JSON key is `type` (`#[serde(rename = "type")]`). Type-specific fields go in `details` (JSONB),
  and their keys must match `BrightP/src/portal/booking.js` `SERVICES[*].fields`.
- **Wings ledger:** every balance change goes through `RewardsService::award(...)`, which updates `users.tokens`,
  `lifetime_points_earned` and inserts into `reward_transactions` in one transaction, then auto-upgrades the tier.
  Never `UPDATE users SET tokens` directly in handlers. The only exceptions are the one-off credit migrations, which mirror the same three writes.
  Redemption debits and refunds use `RewardReason::Redemption` and never touch lifetime points.
- **Earning:** amounts live in table `points_config` (admin-editable at `/admin/loyalty`; defaults in
  `docs/bonus-card-program.md`). Booking Wings are credited when the status moves **into `completed`**.
  Staff manual Wings go to `wings_requests` and need admin approval (an admin's own request is applied immediately).
- **Tiers** by lifetime points, upgrade only: Member 0, Silver 10k, Gold 20k, Platinum 50k
  (`rewards/domain/tier_config.rs`, mirrored in `BrightP/src/portal/booking.js` `TIERS`). Keep both in sync.
- **Referrals:** a forest (each user has at most one referrer, fixed at signup). Monthly batch payout at 1%
  (`REFERRAL_RATE_PERCENT`) cascades bottom-up in one iterative pass, triggered by
  `POST /admin/referrals/run-monthly-payout` (no in-process scheduler). A one-time `referral_booking` bonus goes
  to the referrer on the friend's first completed booking. A **staff** member's `referral_code` doubles as
  their staff code: signing up with it only associates the customer (`users.associated_staff_id`) and pays no Wings.
- **Redemptions:** `requested → approved → voucher_issued → delivered` (or `rejected`/`cancelled`, which refund).
  Wings are deducted at request time. A `voucher_issued` redemption can be used once to book its trip:
  `POST /redemptions/{id}/book` (fully paid, sets `redemptions.booking_id`).
- **Files:** uploads go through `/uploads/*` to the PHP uploader on `resources.brightwingstravel.com`
  (`backend/php_uploader`, deployed by hand on Hostinger). New files are stored flat as `uploads/<uuid>.<ext>`;
  the upload response's `url` is the direct link `https://resources.brightwingstravel.com/uploads/<uuid>.<ext>`.
  Tours/blog store that URL; older features store only the `file_id` and use `file.php?id=<id>`
  (frontend: `services/storage.js` `fileUrl`), which works for old (sub-folder) and new (flat) files.
  `POST /admin/media/move-site-images` (`routers/media.rs`) copies tour/blog images onto the file server.

### Route map (prefix → router file)
`/auth/*` (incl. `/auth/otp/request`), `/users/me`, `/admin/users`, `/staff/users` → `routers/auth/` ·
`/bookings`, `/admin/bookings` → `routers/bookings/booking.rs` (create handlers live in `workflow.rs`) ·
`/portal/bookings`, `/portal/staff/*`, `/preferences`, `/sessions`, `/public/*` → `portal.rs` ·
`/portal/account`, `/referral-invites`, booking messages → `member.rs` ·
steps / offers / Wings requests / staff association → `workflow.rs` (`/portal/offers` scope there) ·
`/loyalty/*` → `loyalty.rs` · `/rewards`, `/admin/rewards*`, `/admin/points-config` → `rewards.rs` ·
`/redemptions`, `/admin/redemptions`, `/admin/reward-items` → `redemptions.rs` ·
`/referrals`, `/admin/referrals` → `referral.rs` · `/crm/*` → `crm.rs` · `/notifications` → `notifications.rs` ·
`/cards/{code}` (public) → `cards.rs` · `/support` → `support.rs` · `/uploads/*` → `uploads.rs` ·
`POST /public/enquiries` (website contact form: saved in `enquiries`, e-mailed to `info@brightwingstravel.com` via `ENQUIRY_SMTP_*`), `POST /public/tour-enquiries/otp` and `POST /public/tour-enquiries/otp/{challenge_id}/verify` (phone-verified destination and tour enquiries) → `enquiries.rs` ·
`/public/blog*` (website blog + comments), `/admin/blog/*` (posts, comment approval) → `blog.rs` ·
`/public/tours?package_type=individual|holiday` (published listing cards), `/public/tours/id/{id}` (published detail by UUID), `/public/tours/{slug}` (slug compatibility), `/public/tour-reviews` (home testimonials), `/public/tour-locations` (Tours page filter), `POST /public/tours/{slug}/booking` (Book This Tour e-mail), `/admin/tours/*` (tours, review approval) → `tours.rs` (see `docs/website-tours-blog.md`) ·
`/admin/portal/*` → `admin_portal.rs` · `/admin/analytics/*` → `analytics.rs` · `/admin/financials` → `financials.rs` · `/health`.

### Commands
```sh
cd backend
cargo build                      # offline sqlx, no DB needed
cargo test --workspace           # what CI runs before deploying
cargo run                        # needs backend/.env (copy .env.example) + a local Postgres
```
Env reference: `backend/README.md` and `backend/.env.example`. Production env: `backend/deploy/bp.env.example`, `render.yaml`.

## Portal frontend (`BrightP/`)

### Layout
```
src/App.js                 every route; ProtectedRoute (adminOnly / staffOnly), PublicRoute
src/services/api.js        THE http client: api.get/post/put/patch/delete/upload, refresh-on-401, envelope unwrap
src/services/storage.js    fileUrl(), upload helpers
src/contexts/AuthContext.js  useAuth(): userData (camelCase user), isAdmin, isSuperAdmin, isStaff, signIn/signUp/logout, refreshUser
src/portal/ui.js           design-system components + helpers (Shell, Page, Card, Badge, Modal, Field, Input, PinBoxes, Tabs, useAsync, useWide, fmtMoney, fmtDate, humanize...)
src/portal/booking.js      SERVICES catalogue (form fields per booking type), STATUS meta, TIERS, TIER_BENEFITS
src/portal/portal.css      design tokens (--pt-*), pt-/st- classes
src/portal/customer/       phone layouts (< 900px) of customer screens
src/portal/desktop/        desktop layouts (>= 900px); routes.js picks one via useWide()
src/portal/staff/          staff/admin workspace, all wrapped in StaffShell (sidebar nav lists in StaffShell.js)
src/portal/Landing.js      public landing page
```

### Conventions
- **Call the API with `api` from `services/api.js` directly in the screen**, loading via
  `const { data, loading, error, reload } = useAsync(() => api.get('/x'), [deps])`. Show `<Spinner>`,
  `<ErrorState onRetry={reload}>` and `<Empty>`. Toasts come from `react-hot-toast`. The contexts
  `BookingContext`, `AdminBookingContext` and `CrmContext` are older and partly used; don't add new
  features to them. `AnalyticsContext` and `src/utils/constants.js` are unused leftovers.
- Build UI from `portal/ui.js` components and `pt-*` classes/tokens (navy + gold palette). Icons come from `lucide-react`.
  Don't add a UI or CSS framework. Tailwind is installed but the portal is written in its own CSS.
- **Every customer screen has two layouts**: a phone one in `customer/` and a desktop one in `desktop/`,
  switched in `desktop/routes.js`. A customer feature usually needs both. Staff screens are single-layout
  inside `StaffShell` (responsive).
- New staff page: add the route in `App.js` (`staffOnly` or `adminOnly`) and a nav entry in `StaffShell.js`
  (`ADMIN_NAV` / `EMPLOYEE_NAV`). The backend role check is the real gate; the frontend gate only hides UI.
- Map backend snake_case to camelCase only where a context already does it (`userData.membershipTier`, etc.).
  Screens that call `api` directly use the raw snake_case fields.
- Money is INR, formatted with `fmtMoney`. Dates use `fmtDate` / `fmtDateTime`. Phones go through `portal/phone.js`
  (`toStoredPhone`, `PhoneField`) before being sent.
- Use the word "Wings" in copy, never "points" or "tokens".

### Commands
```sh
cd BrightP
npm ci --legacy-peer-deps   # what CI uses
npm start                   # http://localhost:3000 against the LIVE API (see golden rule 1)
npm run build               # must pass before you finish; CI builds with CI=true, so lint warnings fail the deploy
npm test                    # one smoke test (App.test.js)
```
To use a local backend: `REACT_APP_API_URL=http://localhost:9010 npm start` and set backend
`ENABLE_APP_CORS=true` with `http://localhost:3000` in `CORS_ALLOWED_ORIGIN`.

## Implementing a new update — checklist

1. Read the relevant router/screen first. Most features already have related tables, routes and UI to extend.
2. Backend: next-numbered migration (idempotent) → handler (app router, runtime sqlx) → right role guard
   and `ensure_staff_access` for booking-scoped staff routes → register the route → `cargo build && cargo test --workspace`.
3. Portal frontend (`BrightP/`): screen(s) using `api` + `useAsync` + `ui.js`; both portal customer layouts if customer-facing; route + nav entry → `npm run build`. For public website or general frontend work, use `bright/` and its own build setup.
4. Keep the rules above consistent (Wings via `RewardsService::award`, tiers in sync, booking `details` keys matching `SERVICES`).
5. Update the matching `docs/*.md` and this file if a rule, route group or convention changed.
6. In your summary, say whether the backend must be deployed before the portal (it almost always must if you added routes or migrations).
