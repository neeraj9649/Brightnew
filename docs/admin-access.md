# Admin and employee access

## Roles

| Role | Lands on | Can do |
|---|---|---|
| `customer` | `/dashboard` | Their own bookings, Wings, account |
| `employee` | `/admin` | Bookings assigned to them, their customers, CRM tasks |
| `admin` | `/admin` | Everything employees can, for all bookings, plus rewards, Team, analytics, loyalty settings |
| `super_admin` | `/admin` | Everything admins can, and the only role that can create/promote/demote admins or deactivate them |

Everyone signs in on the same page, `/auth`, with **phone number + 4-digit PIN**. After sign-in anyone who is
not a customer is sent to `/admin`. The role is read from the account when you sign in, so **after a role
change sign out and sign in again**. Typing `/admin` while signed in as a customer sends you back to `/dashboard`.

## Creating the first admin (the portal cannot do this for you)

There is no screen that makes the first admin: only an existing admin can create staff. Do it once, outside the portal:

1. Register the phone number on the portal's **Join** page (choose your own PIN).
2. Promote it with **one** of:
   - **A migration** (what this project uses): `backend/migrations/0026_promote_owner_super_admin.sql` promotes
     `9649863232` when the backend starts after a push. It runs only once, so the account must already be registered
     at that moment; if it was not, add a new migration (next number) with the same `UPDATE` after registering.
   - **SQL on the production database** (works with any backend version):
     `UPDATE users SET role = 'super_admin' WHERE phone = '9649863232';`
     (use `'admin'` if the backend does not have migration `0025` yet). For a non-Indian number use the stored
     form, e.g. `+14155552671`; Indian numbers are the bare 10 digits.
   - **`SUPER_ADMIN_PHONES=9649863232`** in the backend's environment (`/etc/bp.env` or your host's settings), then
     restart the backend. Requires the backend build that contains `bootstrap.rs`. Check `journalctl -u bp` for
     `SUPER_ADMIN_PHONES: <phone> is now super_admin`.
   - **`backend/scripts/make_super_admin.sh <phone>`** with `DATABASE_URL` (and `API_URL` if the account must be created).
3. Sign out, sign in again, open `/admin`.

## Creating more staff (as an admin or super admin)

`/admin/employees` (Team & permissions) → **Invite employee**:
- Name, phone, HR code (unique), optional e-mail.
- **Initial PIN (optional):** set a 4-digit PIN and tell the person. Leave it empty only if SMS or SMTP is configured,
  because they then choose their own with **Forgot PIN** (the one-time code is sent by SMS/e-mail).
- Role: admins can create **employees**; only a **super admin** can create admins or super admins.

On the same page you can change an existing person's role or deactivate them. Nobody can change their own role or
deactivate themselves, and only a super admin can touch admin accounts.

## Troubleshooting "I sign in but land on the customer dashboard"

1. The account's role is still `customer` — run the promotion above and check with
   `SELECT phone, role FROM users WHERE phone = '...';`.
2. The role changed but you did not sign in again — sign out and back in.
3. The backend that serves the site is not the build you expect (`SUPER_ADMIN_PHONES` does nothing on an older build).
4. The phone is stored differently than you typed it (see the stored form above); check with the `SELECT` above.
