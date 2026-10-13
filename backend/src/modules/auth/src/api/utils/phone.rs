/// Phone numbers are stored in one canonical form so formatting differences do not
/// create duplicate accounts or make a valid login fail:
///   * India (+91): the bare 10-digit number (how every existing account is stored)
///   * everywhere else: `+` followed by the country code and national number (E.164)
pub fn normalize_phone(value: &str) -> String {
    let trimmed = value.trim();
    let mut normalized = String::with_capacity(trimmed.len());
    for (index, ch) in trimmed.chars().enumerate() {
        if ch.is_ascii_digit() || (ch == '+' && index == 0) {
            normalized.push(ch);
        }
    }
    // +91XXXXXXXXXX is the same person as XXXXXXXXXX.
    if let Some(rest) = normalized.strip_prefix("+91") {
        if rest.len() == 10 {
            return rest.to_string();
        }
    }
    normalized
}

pub fn is_valid_phone(value: &str) -> bool {
    if !value
        .trim()
        .chars()
        .all(|ch| ch.is_ascii_digit() || matches!(ch, '+' | '-' | ' ' | '(' | ')'))
    {
        return false;
    }
    // A "+" is only meaningful as the very first character.
    if value.trim().get(1..).is_some_and(|rest| rest.contains('+')) {
        return false;
    }
    let normalized = normalize_phone(value);
    let digits = normalized.chars().filter(|ch| ch.is_ascii_digit()).count();
    if let Some(international) = normalized.strip_prefix('+') {
        // E.164: country code (never starting with 0) + national number, 15 digits at most.
        return (8..=15).contains(&digits) && !international.starts_with('0');
    }
    // Bare numbers are Indian mobiles (or older accounts created before country codes existed).
    (5..=20).contains(&digits)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn indian_numbers_keep_their_stored_form() {
        assert_eq!(normalize_phone("98765 43210"), "9876543210");
        assert_eq!(normalize_phone("+91 98765-43210"), "9876543210");
        assert_eq!(normalize_phone("9876543210"), "9876543210");
    }

    #[test]
    fn international_numbers_are_e164() {
        assert_eq!(normalize_phone("+1 (415) 555-2671"), "+14155552671");
        assert_eq!(normalize_phone("+44 7700 900123"), "+447700900123");
        assert_eq!(normalize_phone("+971 50 123 4567"), "+971501234567");
    }

    #[test]
    fn validation() {
        assert!(is_valid_phone("9876543210"));
        assert!(is_valid_phone("+91 98765 43210"));
        assert!(is_valid_phone("+14155552671"));
        assert!(is_valid_phone("+65 8123 4567"));
        assert!(!is_valid_phone("+0123456789"));
        assert!(!is_valid_phone("+1234"));
        assert!(!is_valid_phone("+12345678901234567"));
        assert!(!is_valid_phone("98765+43210"));
        assert!(!is_valid_phone("abc"));
        assert!(!is_valid_phone(""));
    }
}
