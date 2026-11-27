use auth::api::utils::phone::{is_valid_phone, normalize_phone};
use base::role::SUPER_ADMIN;
use futures_util::{stream, StreamExt};
use sqlx::PgPool;
use uuid::Uuid;

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

/// Says at start-up whether sign-in codes can go out by WhatsApp and SMS. The deploy workflow prints this line,
/// so a missing or unreadable Twilio setting is visible straight after a deploy.
pub fn log_sign_in_code_delivery() {
    if shared::twilio::whatsapp_configured() {
        log::warn!("Sign-in codes: WhatsApp is on (SMS is the fallback)");
    } else {
        log::warn!("Sign-in codes: WhatsApp is off (WHATSAPP_OTP_FROM=off or no Twilio credentials)");
    }
    if shared::twilio::verify_configured() {
        log::warn!("Sign-in codes: Twilio Verify is configured");
    } else {
        log::warn!(
            "Sign-in codes: Twilio Verify is NOT configured (set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_VERIFY_SERVICE_SID); codes can only be e-mailed"
        );
    }
}

pub fn spawn_tour_whatsapp_greetings(pool: PgPool) {
    actix_web::rt::spawn(async move {
        let mut tick = actix_web::rt::time::interval(std::time::Duration::from_secs(30));
        loop {
            tick.tick().await;
            let enquiries = sqlx::query_as::<_, (Uuid, String, String, String, bool)>(
                "SELECT id, name, whatsapp_greeting_to, whatsapp_message_sid,
                        created_at < NOW() - INTERVAL '48 hours'
                 FROM enquiries
                 WHERE whatsapp_greeting_check_at <= NOW() AND whatsapp_greeting_status IS NULL
                   AND whatsapp_greeting_to IS NOT NULL AND whatsapp_message_sid IS NOT NULL
                 ORDER BY whatsapp_greeting_check_at LIMIT 20",
            )
            .fetch_all(&pool)
            .await;
            match enquiries {
                Ok(rows) => {
                    let pool = &pool;
                    stream::iter(rows).for_each_concurrent(5, |(id, name, phone, office_sid, expired)| async move {
                        if let Err(error) = check_tour_whatsapp(pool, id, &name, &phone, &office_sid, expired).await {
                            log::warn!("tour enquiry {id}: could not store WhatsApp greeting progress: {error}");
                        }
                    }).await;
                }
                Err(error) => log::warn!("could not load pending WhatsApp greetings: {error}"),
            }
        }
    });
}

async fn check_tour_whatsapp(pool: &PgPool, id: Uuid, name: &str, phone: &str, office_sid: &str, expired: bool) -> Result<(), sqlx::Error> {
    if expired {
        return stop_tour_greeting(pool, id, "expired", Some("Office delivery and greeting approval were not confirmed in time")).await;
    }

    // Reschedule before network calls. Another backend instance can recover if this process stops.
    let reserved = sqlx::query(
        "UPDATE enquiries SET whatsapp_greeting_check_at = NOW() + INTERVAL '2 minutes'
         WHERE id = $1 AND whatsapp_greeting_check_at <= NOW() AND whatsapp_greeting_status IS NULL",
    )
    .bind(id)
    .execute(pool)
    .await?;
    if reserved.rows_affected() == 0 {
        return Ok(());
    }

    match shared::twilio::whatsapp_status(office_sid).await {
        Ok((status, _)) if matches!(status.as_str(), "delivered" | "read") => {}
        Ok((status, code)) if matches!(status.as_str(), "failed" | "undelivered" | "canceled") => {
            let reason = format!("Office notification {status} (Twilio error {code:?})");
            return stop_tour_greeting(pool, id, "office_not_delivered", Some(&reason)).await;
        }
        _ => return Ok(()),
    }

    let Ok(template) = shared::twilio::approved_tour_greeting_template().await else { return Ok(()) };
    // Claim the send before calling Twilio so repeated delivery checks cannot greet twice.
    let claimed = sqlx::query(
        "UPDATE enquiries SET whatsapp_greeting_status = 'sending', whatsapp_greeting_check_at = NULL
         WHERE id = $1 AND whatsapp_greeting_status IS NULL",
    )
    .bind(id)
    .execute(pool)
    .await?;
    if claimed.rows_affected() == 0 {
        return Ok(());
    }

    let (sid, error) = match shared::twilio::send_tour_greeting_whatsapp(phone, name, &template).await {
        Ok(sid) => (Some(sid), None),
        Err(error) => (None, Some(error)),
    };
    sqlx::query(
        "UPDATE enquiries SET whatsapp_greeting_status = $2, whatsapp_greeting_message_sid = $3, whatsapp_greeting_error = $4
         WHERE id = $1",
    )
    .bind(id)
    .bind(if sid.is_some() { "accepted" } else { "failed" })
    .bind(sid)
    .bind(error)
    .execute(pool)
    .await?;
    Ok(())
}

async fn stop_tour_greeting(pool: &PgPool, id: Uuid, status: &str, error: Option<&str>) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE enquiries SET whatsapp_greeting_status = $2, whatsapp_greeting_error = $3, whatsapp_greeting_check_at = NULL
         WHERE id = $1 AND whatsapp_greeting_status IS NULL",
    )
    .bind(id)
    .bind(status)
    .bind(error)
    .execute(pool)
    .await?;
    Ok(())
}
