use base::constants::PASSWORD_HASH_SECRET;
use sha2::{Digest, Sha256};

pub fn hash_pin(pin: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(pin);
    hasher.update(PASSWORD_HASH_SECRET.as_bytes());
    format!("{:x}", hasher.finalize())
}

pub fn verify_pin(pin: &str, hash: &str) -> bool {
    hash_pin(pin) == hash
}

/// Exactly 4 ASCII digits, like a bank card PIN.
pub fn is_valid_pin_format(pin: &str) -> bool {
    pin.len() == 4 && pin.chars().all(|c| c.is_ascii_digit())
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
        assert!(is_valid_pin_format("1234"));
        assert!(!is_valid_pin_format("123456"));
        assert!(!is_valid_pin_format("123"));
        assert!(!is_valid_pin_format("12345"));
        assert!(!is_valid_pin_format("12a4"));
    }
}
