#!/usr/bin/env bash
# One-way sync: live Postgres -> local Postgres. Never writes to live.
# Setup: put PROD_DATABASE_URL=postgres://... in backend/.env.sync (git-ignored).
# Local target is DATABASE_URL from backend/.env and must point at localhost.
set -euo pipefail
cd "$(dirname "$0")/.."

set -a
[ -f .env ] && . ./.env
[ -f .env.sync ] && . ./.env.sync
set +a

: "${PROD_DATABASE_URL:?Set PROD_DATABASE_URL in backend/.env.sync}"
: "${DATABASE_URL:?Set DATABASE_URL in backend/.env}"

case "$DATABASE_URL" in
  *localhost*|*127.0.0.1*|postgresql:///*|postgres:///*) ;;
  *) echo "Refusing: DATABASE_URL is not a local database." >&2; exit 1 ;;
esac
[ "$DATABASE_URL" != "$PROD_DATABASE_URL" ] || { echo "Refusing: local and live URLs are identical." >&2; exit 1; }

DUMP="$(mktemp -t bp_prod.XXXXXX)"
trap 'rm -f "$DUMP"' EXIT

echo "Dumping live database (read-only)..."
pg_dump --format=custom --no-owner --no-privileges "$PROD_DATABASE_URL" -f "$DUMP"

echo "Restoring into local database (existing local data is replaced)..."
pg_restore --clean --if-exists --no-owner --no-privileges --single-transaction -d "$DATABASE_URL" "$DUMP"

echo "Done. Live users can now log in locally."
echo "Local .env must use the same JWT_SECRET, REFRESH_TOKEN_SECRET and PASSWORD_HASH_SECRET as live."
