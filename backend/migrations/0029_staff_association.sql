-- Every customer can be associated with the staff member who looks after them.
--   staff_added  – the customer was added by that staff member
--   staff_code   – the customer signed up with the staff member's code
--   referral     – the customer joined through a customer who is associated with that staff member
--   admin        – an admin assigned (or changed) it
-- Customers without an association stay NULL until an admin assigns them.
ALTER TABLE users ADD COLUMN IF NOT EXISTS associated_staff_id UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS association_source VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS associated_at TIMESTAMPTZ;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_association_source_check;
ALTER TABLE users ADD CONSTRAINT users_association_source_check
    CHECK (association_source IS NULL OR association_source IN ('staff_added', 'staff_code', 'referral', 'admin'));
CREATE INDEX IF NOT EXISTS idx_users_associated_staff ON users(associated_staff_id) WHERE associated_staff_id IS NOT NULL;

-- A staff member's code is their referral_code. Make sure every account has one (older accounts may not).
DO $$
DECLARE
    r RECORD;
    c TEXT;
BEGIN
    FOR r IN SELECT id FROM users WHERE referral_code IS NULL LOOP
        LOOP
            c := upper(substr(md5(random()::text || clock_timestamp()::text || r.id::text), 1, 8));
            EXIT WHEN NOT EXISTS (SELECT 1 FROM users WHERE referral_code = c);
        END LOOP;
        UPDATE users SET referral_code = c WHERE id = r.id;
    END LOOP;
END
$$;
