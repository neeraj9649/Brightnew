#!/usr/bin/env bash
# Promote an existing account to the super_admin role.
#
#   DATABASE_URL=postgres://... backend/scripts/make_super_admin.sh 9649863232
#
# Joining needs a code texted to the phone, so this script cannot create the account: register the number on the portal's
# Join page first, then run it. Sign out and back in afterwards to get the new role.
set -euo pipefail

PHONE="${1:-}"
[[ "$PHONE" =~ ^[6-9][0-9]{9}$ ]] || { echo "usage: $0 <10-digit Indian mobile>" >&2; exit 2; }
: "${DATABASE_URL:?set DATABASE_URL}"
PSQL=(psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -Atq)

exists=$("${PSQL[@]}" -c "SELECT count(*) FROM users WHERE phone = '$PHONE'")
if [[ "$exists" == "0" ]]; then
  echo "No account uses $PHONE yet. Join on the portal with that number first, then run this again." >&2
  exit 1
fi

"${PSQL[@]}" -c "UPDATE users SET role = 'super_admin', is_active = true WHERE phone = '$PHONE'" >/dev/null
echo "OK: $PHONE is now super_admin. Sign in with that phone number and your 4-digit passcode."
