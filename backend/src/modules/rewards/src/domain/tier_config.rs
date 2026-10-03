/// Lifetime-point thresholds for tier auto-upgrade, env-configurable
/// (`TIER_THRESHOLD_<TIER>`), defaulting to round placeholder numbers.
fn env_threshold(suffix: &str, default: i64) -> i64 {
    dotenv::dotenv().ok();
    std::env::var(format!("TIER_THRESHOLD_{}", suffix))
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(default)
}

pub fn tier_for_lifetime_points(lifetime_points: i64) -> &'static str {
    if lifetime_points >= env_threshold("TITANIUM", 20_000) {
        "Titanium"
    } else if lifetime_points >= env_threshold("PLATINUM", 5_000) {
        "Platinum"
    } else if lifetime_points >= env_threshold("GOLD", 1_000) {
        "Gold"
    } else {
        "Silver"
    }
}

/// Higher rank never auto-downgrades to a lower one.
pub fn tier_rank(tier: &str) -> u8 {
    match tier {
        "Titanium" => 3,
        "Platinum" => 2,
        "Gold" => 1,
        _ => 0,
    }
}
