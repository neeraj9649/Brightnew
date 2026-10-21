-- Promote the explicitly approved account to admin in every environment.
-- This is intentionally an update-only migration: it never creates an account,
-- changes a PIN, or touches any other user's role.
UPDATE users
SET role = 'admin'
WHERE phone = '8000192248'
  AND role <> 'super_admin';
