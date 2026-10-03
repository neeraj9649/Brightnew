-- Employee HR code. Nullable: only staff have one (customers don't).
-- UNIQUE still allows many NULLs in Postgres, so customer rows are unaffected.
ALTER TABLE users ADD COLUMN hr_code VARCHAR(50) UNIQUE;
