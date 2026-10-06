use chrono::{Datelike, NaiveDate, Utc};
use rand::Rng;

fn tier_code(tier: &str) -> &'static str {
    match tier {
        "Gold" => "GLD",
        "Platinum" => "PLT",
        "Titanium" => "TTN",
        _ => "SLV",
    }
}

fn age_from(date_of_birth: Option<NaiveDate>) -> i64 {
    let Some(date_of_birth) = date_of_birth else { return 0; };
    let today = Utc::now().date_naive();
    let mut age = today.year() as i64 - date_of_birth.year() as i64;
    if (today.month(), today.day()) < (date_of_birth.month(), date_of_birth.day()) {
        age -= 1;
    }
    age.max(0)
}

/// e.g. "JO29BRZ4821": first 2 letters of the name + age + tier + a random
/// 4-digit suffix. The prefix is intentionally derivable from things the
/// cardholder already knows about themselves; only the 4-digit suffix is
/// random, mirroring how a real card's last 4 digits are what you actually
/// memorize.
pub fn generate_membership_code(
    first_name: &str,
    date_of_birth: Option<NaiveDate>,
    tier: &str,
) -> String {
    let mut initials: String = first_name
        .chars()
        .filter(|c| c.is_ascii_alphabetic())
        .take(2)
        .collect::<String>()
        .to_uppercase();
    while initials.len() < 2 {
        initials.push('X');
    }

    let suffix: u32 = rand::thread_rng().gen_range(0..10_000);
    format!(
        "{}{}{}{:04}",
        initials,
        age_from(date_of_birth),
        tier_code(tier),
        suffix
    )
}

/// 8 random uppercase alphanumeric characters -- a code meant to be shared
/// (referral links/QR), so it carries no derivable personal info unlike the
/// membership code above.
pub fn generate_referral_code() -> String {
    const CHARSET: &[u8] = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let mut rng = rand::thread_rng();
    (0..8)
        .map(|_| CHARSET[rng.gen_range(0..CHARSET.len())] as char)
        .collect()
}
