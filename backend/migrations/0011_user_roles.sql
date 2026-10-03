ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'employee', 'admin'));
UPDATE users SET role = 'admin' WHERE is_admin = true;
ALTER TABLE users DROP COLUMN is_admin;

CREATE INDEX idx_users_role ON users(role) WHERE role != 'customer';
