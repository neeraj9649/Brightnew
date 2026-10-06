/// Store phone numbers in a stable form so formatting differences do not
/// create duplicate accounts or make a valid login fail.
pub fn normalize_phone(value: &str) -> String {
    let trimmed = value.trim();
    let mut normalized = String::with_capacity(trimmed.len());
    for (index, ch) in trimmed.chars().enumerate() {
        if ch.is_ascii_digit() || (ch == '+' && index == 0) {
            normalized.push(ch);
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
    let normalized = normalize_phone(value);
    let digits = normalized.chars().filter(|ch| ch.is_ascii_digit()).count();
    (5..=20).contains(&digits)
        && normalized
            .chars()
            .all(|ch| ch.is_ascii_digit() || ch == '+')
        && !normalized[1..].contains('+')
}
