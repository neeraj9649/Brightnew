//! The member's 4-digit sign-in passcode (stored in `users.pin_hash`).
//!
//! The hash scheme is the one the old PIN used, so accounts that set a PIN before the
//! one-time-code period still sign in with it.

use base::constants::PASSWORD_HASH_SECRET;
use sha2::{Digest, Sha256};
use uuid::Uuid;

pub fn hash_pin(pin: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(pin);
    hasher.update(PASSWORD_HASH_SECRET.as_bytes());
    format!("{:x}", hasher.finalize())
}

pub fn verify_pin(pin: &str, hash: &str) -> bool {
    hash_pin(pin) == hash
}

/// Exactly 4 ASCII digits.
pub fn is_valid_pin_format(pin: &str) -> bool {
    pin.len() == 4 && pin.chars().all(|c| c.is_ascii_digit())
}

/// For accounts created by staff: `users.pin_hash` is NOT NULL, so they get the hash of a random
/// value nobody knows. The member sets their own passcode with "Forgot passcode" (code by SMS).
pub fn unusable_pin_hash() -> String {
    let mut hasher = Sha256::new();
    hasher.update(Uuid::new_v4().to_string());
    hasher.update(PASSWORD_HASH_SECRET.as_bytes());
    format!("{:x}", hasher.finalize())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hash_and_verify_round_trip() {
        let hash = hash_pin("1234");
        assert!(verify_pin("1234", &hash));
        assert!(!verify_pin("4321", &hash));
    }

    #[test]
    fn pin_format_validation() {
        assert!(is_valid_pin_format("0421"));
        assert!(!is_valid_pin_format("123"));
        assert!(!is_valid_pin_format("12345"));
        assert!(!is_valid_pin_format("12a4"));
    }

    #[test]
    fn unusable_hash_matches_no_passcode() {
        let hash = unusable_pin_hash();
        assert!(!verify_pin("0000", &hash));
        assert!(!verify_pin("1234", &hash));
    }
}
