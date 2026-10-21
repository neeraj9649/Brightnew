use std::collections::HashMap;
use std::sync::Mutex;
use std::time::{Duration, Instant};

use lazy_static::lazy_static;

use crate::error::ApiError;

/// Fixed-window counter kept in memory (per process). Good enough to stop PIN
/// guessing and invite spam on a single API instance; it resets on restart.
struct Window {
    count: u32,
    started: Instant,
}

pub struct AttemptLimiter {
    entries: Mutex<HashMap<String, Window>>,
}

const MAX_TRACKED_KEYS: usize = 50_000;

impl AttemptLimiter {
    fn new() -> Self {
        Self { entries: Mutex::new(HashMap::new()) }
    }

    /// Err(429) when `key` already used up `max` attempts inside `window`.
    pub fn check(&self, key: &str, max: u32, window: Duration) -> Result<(), ApiError> {
        let entries = self.entries.lock().unwrap_or_else(|e| e.into_inner());
        match entries.get(key) {
            Some(w) if w.started.elapsed() < window && w.count >= max => {
                let wait = (window - w.started.elapsed()).as_secs() / 60 + 1;
                Err(ApiError::new(
                    format!("Too many attempts. Please try again in about {wait} minute(s)."),
                    429,
                ))
            }
            _ => Ok(()),
        }
    }

    /// Counts one attempt against `key` (starts a new window when the old one ended).
    pub fn record(&self, key: &str, window: Duration) {
        let mut entries = self.entries.lock().unwrap_or_else(|e| e.into_inner());
        if entries.len() > MAX_TRACKED_KEYS {
            entries.retain(|_, w| w.started.elapsed() < window);
        }
        let entry = entries
            .entry(key.to_string())
            .or_insert_with(|| Window { count: 0, started: Instant::now() });
        if entry.started.elapsed() >= window {
            entry.count = 0;
            entry.started = Instant::now();
        }
        entry.count += 1;
    }

    /// `check` + `record` in one step, for actions that always count (e.g. sending an invite).
    pub fn hit(&self, key: &str, max: u32, window: Duration) -> Result<(), ApiError> {
        self.check(key, max, window)?;
        self.record(key, window);
        Ok(())
    }

    pub fn clear(&self, key: &str) {
        self.entries.lock().unwrap_or_else(|e| e.into_inner()).remove(key);
    }
}

lazy_static! {
    pub static ref LIMITER: AttemptLimiter = AttemptLimiter::new();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn blocks_after_max_and_clears() {
        let limiter = AttemptLimiter::new();
        let window = Duration::from_secs(60);
        for _ in 0..3 {
            assert!(limiter.check("k", 3, window).is_ok());
            limiter.record("k", window);
        }
        assert!(limiter.check("k", 3, window).is_err());
        assert!(limiter.check("other", 3, window).is_ok());
        limiter.clear("k");
        assert!(limiter.check("k", 3, window).is_ok());
    }
}
