#!/usr/bin/env bash
# Promote a phone number to the super_admin role, creating the account first if it
# does not exist yet. Sign-in is phone + 4-digit PIN like every other account.
#
#   DATABASE_URL=postgres://... API_URL=https://your-api.example.com \
#     backend/scripts/make_super_admin.sh 9649863232 "First Last"
#
# - Existing account: only the role changes; the member keeps their own PIN.
# - New account: registered through the API (so membership code, referral code and
#   welcome Wings are created normally) with a random PIN that is printed ONCE.
# Run it after the backend with migration 0025 has been deployed.
set -euo pipefail

PHONE="${1:-}"; NAME="${2:-Super Admin}"
[[ "$PHONE" =~ ^[6-9][0-9]{9}$ ]] || { echo "usage: $0 <10-digit mobile> [\"First Last\"]" >&2; exit 2; }
: "${DATABASE_URL:?set DATABASE_URL}"
PSQL=(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -Atq)

exists=$("${PSQL[@]}" -c "SELECT count(*) FROM users WHERE phone = '$PHONE'")
pin=""
if [[ "$exists" == "0" ]]; then
  : "${API_URL:?set API_URL to create a new account}"
  pin=$(printf '%04d' $((RANDOM % 10000)))
  first="${NAME%% *}"; last=""; [[ "$NAME" == *" "* ]] && last="${NAME#* }"
  code=$(curl -s -o /tmp/make_super_admin.out -w '%{http_code}' -X POST "$API_URL/auth/register" \
    -H 'content-type: application/json' \
    -d "{\"phone\":\"$PHONE\",\"pin\":\"$pin\",\"first_name\":\"$first\",\"last_name\":$([[ -n "$last" ]] && printf '"%s"' "$last" || echo null)}")
  [[ "$code" == 2* ]] || { echo "registration failed (HTTP $code): $(cat /tmp/make_super_admin.out)" >&2; exit 1; }
  rm -f /tmp/make_super_admin.out
fi

"${PSQL[@]}" -c "UPDATE users SET role = 'super_admin', is_active = true WHERE phone = '$PHONE'" >/dev/null
echo "OK: $PHONE is now super_admin."
if [[ -n "$pin" ]]; then echo "Sign in with phone $PHONE and PIN $pin (shown once — change it after first sign-in)."
else echo "Existing account: sign in with that member's current PIN."; fi
