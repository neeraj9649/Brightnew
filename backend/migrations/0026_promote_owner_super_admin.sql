-- One-time promotion of the owner's already-registered account to super_admin, so no
-- database shell is needed on the server. Safe to re-run: it only touches that one phone
-- and does nothing if the account is not registered yet (register on the portal first).
-- Deliberately a plain UPDATE, not a trigger: phone numbers are not verified at sign-up,
-- so a standing "this phone becomes super_admin" rule would let anyone who registers the
-- number first take over.
UPDATE users
   SET role = 'super_admin', is_active = true
 WHERE phone IN ('9649863232', '+919649863232')
   AND role <> 'super_admin';
