use lettre::message::Message;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{SmtpTransport, Transport};

fn env_optional(key: &str) -> Option<String> {
    std::env::var(key).ok().map(|value| value.trim().to_string()).filter(|value| !value.is_empty())
}

/// One SMTP account. Read from env vars that share a prefix: `SMTP_` for member mail
/// (codes, invites, welcome) and `ENQUIRY_SMTP_` for website contact-form mail, so the
/// two can use different mailboxes.
struct SmtpAccount {
    host: String,
    port: u16,
    username: String,
    password: String,
    from: String,
}

impl SmtpAccount {
    fn from_env(prefix: &str) -> Result<Self, String> {
        let var = |name: &str| env_optional(&format!("{prefix}{name}"));
        let host = var("HOST").ok_or(format!("{prefix}HOST not configured"))?;
        let port: u16 = var("PORT")
            .unwrap_or_else(|| "587".to_string())
            .parse()
            .map_err(|_| format!("invalid {prefix}PORT"))?;
        let username = var("USERNAME").ok_or(format!("{prefix}USERNAME not configured"))?;
        let password = var("PASSWORD").ok_or(format!("{prefix}PASSWORD not configured"))?;
        let from = var("FROM_ADDRESS").unwrap_or_else(|| username.clone());
        Ok(Self { host, port, username, password, from })
    }

    fn send(self, to: &str, reply_to: Option<&str>, subject: &str, body: &str) -> Result<(), String> {
        let mut builder = Message::builder()
            .from(self.from.parse().map_err(|e| format!("invalid from address: {e}"))?)
            .to(to.parse().map_err(|e| format!("invalid recipient address: {e}"))?)
            .subject(subject);
        if let Some(reply_to) = reply_to {
            builder = builder.reply_to(reply_to.parse().map_err(|e| format!("invalid reply-to address: {e}"))?);
        }
        let email = builder.body(body.to_string()).map_err(|e| e.to_string())?;

        // Port 465 uses TLS from the first byte; 587 (and others) upgrade with STARTTLS.
        let transport = if self.port == 465 {
            SmtpTransport::relay(&self.host)
        } else {
            SmtpTransport::starttls_relay(&self.host)
        };
        let mailer = transport
            .map_err(|e| e.to_string())?
            .port(self.port)
            .credentials(Credentials::new(self.username, self.password))
            .build();

        mailer.send(&email).map_err(|e| e.to_string())?;
        Ok(())
    }
}

/// Best-effort plain-text email send. SMTP_* env vars are optional
/// placeholders until a real mail account is configured; callers should
/// treat a failure here as non-fatal.
pub fn send_plain_email(to: &str, subject: &str, body: &str) -> Result<(), String> {
    SmtpAccount::from_env("SMTP_")?.send(to, None, subject, body)
}

/// Sends website mail (contact enquiries, tour booking requests) with the `ENQUIRY_SMTP_*` account.
/// `reply_to` is the visitor's address when known, so pressing Reply answers the visitor directly.
pub fn send_enquiry_email(to: &str, reply_to: Option<&str>, subject: &str, body: &str) -> Result<(), String> {
    SmtpAccount::from_env("ENQUIRY_SMTP_")?.send(to, reply_to, subject, body)
}
