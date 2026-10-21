use auth::api::utils::phone::{is_valid_phone, normalize_phone};
use base::role::SUPER_ADMIN;

/// Promotes the accounts listed in `SUPER_ADMIN_PHONES` (comma-separated phone numbers) to
/// `super_admin` on startup, so the first super admin never needs database access.
///
/// It only promotes accounts that already exist (register through the portal first) and never
/// demotes or creates anyone, so removing a number from the variable does not revoke the role.
pub async fn promote_super_admins(pool: &sqlx::PgPool) {
    let Ok(list) = std::env::var("SUPER_ADMIN_PHONES") else { return };
    for raw in list.split(',').map(str::trim).filter(|p| !p.is_empty()) {
        if !is_valid_phone(raw) {
            log::warn!("SUPER_ADMIN_PHONES: ignoring invalid phone number {raw:?}");
            continue;
        }
        let phone = normalize_phone(raw);
        match sqlx::query("UPDATE users SET role = $1, is_active = true WHERE phone = $2 AND role <> $1")
            .bind(SUPER_ADMIN)
            .bind(&phone)
            .execute(pool)
            .await
        {
            Ok(done) if done.rows_affected() > 0 => log::warn!("SUPER_ADMIN_PHONES: {phone} is now super_admin"),
            Ok(_) => {}
            Err(e) => log::error!("SUPER_ADMIN_PHONES: could not promote {phone}: {e}"),
        }
    }
}

/// Every few hours, deletes sign-ins that ended more than a week ago (every token in the session
/// has expired). Live sessions are never touched, so the account's sign-in history stays intact.
pub fn spawn_refresh_token_cleanup(pool: sqlx::PgPool) {
    actix_web::rt::spawn(async move {
        let mut tick = actix_web::rt::time::interval(std::time::Duration::from_secs(6 * 60 * 60));
        loop {
            tick.tick().await;
            let result = sqlx::query(
                "DELETE FROM refresh_tokens WHERE family_id IN (SELECT family_id FROM refresh_tokens GROUP BY family_id HAVING MAX(expires_at) < NOW() - INTERVAL '7 days')",
            )
            .execute(&pool)
            .await;
            match result {
                Ok(done) if done.rows_affected() > 0 => log::info!("removed {} expired refresh tokens", done.rows_affected()),
                Ok(_) => {}
                Err(err) => log::warn!("refresh-token cleanup failed: {err}"),
            }
        }
    });
}
