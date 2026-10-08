-- Keep previously applied migrations unchanged. Apply HR-code schema changes
-- here so existing databases can upgrade without a migration checksum mismatch.
ALTER TABLE users ADD COLUMN IF NOT EXISTS hr_code VARCHAR(50);
ALTER TABLE users
    ALTER COLUMN hr_code TYPE VARCHAR(50),
    ALTER COLUMN hr_code DROP NOT NULL;

-- Reuse the index created by the original UNIQUE constraint when it exists.
-- PostgreSQL permits multiple NULLs while rejecting duplicate staff HR codes.
CREATE UNIQUE INDEX IF NOT EXISTS users_hr_code_key ON users (hr_code);
