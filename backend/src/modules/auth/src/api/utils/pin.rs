use base::constants::PASSWORD_HASH_SECRET;
use sha2::{Digest, Sha256};
use uuid::Uuid;

/// Sign-in is by one-time code, so nobody has a PIN any more. `users.pin_hash` is still
/// NOT NULL, so new accounts get the hash of a random value that no one knows.
pub fn unusable_pin_hash() -> String {
    let mut hasher = Sha256::new();
    hasher.update(Uuid::new_v4().to_string());
    hasher.update(PASSWORD_HASH_SECRET.as_bytes());
    format!("{:x}", hasher.finalize())
}
