use lettre::message::Message;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{SmtpTransport, Transport};

fn env_optional(key: &str) -> Option<String> {
    std::env::var(key).ok().map(|value| value.trim().to_string()).filter(|value| !value.is_empty())
}

/// Best-effort plain-text email send. SMTP_* env vars are optional
/// placeholders until a real mail account is configured; callers should
/// treat a failure here as non-fatal.
pub fn send_plain_email(to: &str, subject: &str, body: &str) -> Result<(), String> {
    let host = env_optional("SMTP_HOST").ok_or("SMTP_HOST not configured")?;
    let port: u16 = env_optional("SMTP_PORT")
        .unwrap_or_else(|| "587".to_string())
        .parse()
        .map_err(|_| "invalid SMTP_PORT".to_string())?;
    let username = env_optional("SMTP_USERNAME").ok_or("SMTP_USERNAME not configured")?;
    let password = env_optional("SMTP_PASSWORD").ok_or("SMTP_PASSWORD not configured")?;
    let from = env_optional("SMTP_FROM_ADDRESS").unwrap_or_else(|| username.clone());

    let email = Message::builder()
        .from(from.parse().map_err(|e| format!("invalid SMTP_FROM_ADDRESS: {e}"))?)
        .to(to.parse().map_err(|e| format!("invalid recipient address: {e}"))?)
        .subject(subject)
        .body(body.to_string())
        .map_err(|e| e.to_string())?;

    let mailer = SmtpTransport::relay(&host)
        .map_err(|e| e.to_string())?
        .port(port)
        .credentials(Credentials::new(username, password))
        .build();

    mailer.send(&email).map_err(|e| e.to_string())?;
    Ok(())
}
