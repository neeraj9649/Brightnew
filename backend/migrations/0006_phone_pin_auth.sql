-- Switch primary credential from email+password to phone+PIN.
-- Existing rows are dev/test fixtures (confirmed disposable) -- wiped so the
-- new UNIQUE NOT NULL phone constraint has clean data to apply to.
-- ON DELETE CASCADE on bookings/refresh_tokens.user_id clears those too.
DELETE FROM users;

ALTER TABLE users RENAME COLUMN password_hash TO pin_hash;
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);
