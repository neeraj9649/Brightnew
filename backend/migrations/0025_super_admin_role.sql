-- Adds the `super_admin` role: everything an admin can do, plus managing
-- admin accounts and staff roles. Promote someone with scripts/make_super_admin.sh.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('customer', 'employee', 'admin', 'super_admin'));
