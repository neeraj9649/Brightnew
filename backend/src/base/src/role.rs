pub const CUSTOMER: &str = "customer";
pub const EMPLOYEE: &str = "employee";
pub const ADMIN: &str = "admin";
/// Everything an admin can do, plus managing other admins and staff roles.
pub const SUPER_ADMIN: &str = "super_admin";

pub const STAFF: &[&str] = &[EMPLOYEE, ADMIN, SUPER_ADMIN];
pub const ADMIN_ONLY: &[&str] = &[ADMIN, SUPER_ADMIN];
pub const SUPER_ADMIN_ONLY: &[&str] = &[SUPER_ADMIN];

/// True for `admin` and `super_admin`.
pub fn is_admin(role: &str) -> bool {
    role == ADMIN || role == SUPER_ADMIN
}
