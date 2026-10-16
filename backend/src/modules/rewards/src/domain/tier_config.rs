/// Bright Wings Elite Card tiers, by lifetime points earned (redeeming never lowers a tier).
///
///   Member    – everyone who joins (welcome bonus), below the Silver threshold
///   Silver    – 10,000 points
///   Gold      – 20,000 points
///   Platinum  – 50,000 points
///
/// The thresholds can be overridden with `TIER_THRESHOLD_SILVER|GOLD|PLATINUM`.
fn env_threshold(suffix: &str, default: i64) -> i64 {
    dotenv::dotenv().ok();
    std::env::var(format!("TIER_THRESHOLD_{}", suffix))
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(default)
}

/// The tier ladder, lowest first: `(tier, lifetime points needed)`.
pub fn tier_ladder() -> [(&'static str, i64); 4] {
    [
        ("Member", 0),
        ("Silver", env_threshold("SILVER", 10_000)),
        ("Gold", env_threshold("GOLD", 20_000)),
        ("Platinum", env_threshold("PLATINUM", 50_000)),
    ]
}

pub fn tier_for_lifetime_points(lifetime_points: i64) -> &'static str {
    tier_ladder()
        .iter()
        .rev()
        .find(|(_, threshold)| lifetime_points >= *threshold)
        .map(|(tier, _)| *tier)
        .unwrap_or("Member")
}

/// The tier after `current` and the points it needs, or `None` at the top.
pub fn next_tier(current: &str) -> Option<(&'static str, i64)> {
    let ladder = tier_ladder();
    let index = ladder.iter().position(|(tier, _)| *tier == current)?;
    ladder.get(index + 1).copied()
}

/// Higher rank never auto-downgrades to a lower one. The retired "Titanium" tier
/// ranks with Platinum so old values never break a comparison.
pub fn tier_rank(tier: &str) -> u8 {
    match tier {
        "Platinum" | "Titanium" => 3,
        "Gold" => 2,
        "Silver" => 1,
        _ => 0,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tiers_follow_the_program_thresholds() {
        assert_eq!(tier_for_lifetime_points(0), "Member");
        assert_eq!(tier_for_lifetime_points(200), "Member");
        assert_eq!(tier_for_lifetime_points(9_999), "Member");
        assert_eq!(tier_for_lifetime_points(10_000), "Silver");
        assert_eq!(tier_for_lifetime_points(19_999), "Silver");
        assert_eq!(tier_for_lifetime_points(20_000), "Gold");
        assert_eq!(tier_for_lifetime_points(49_999), "Gold");
        assert_eq!(tier_for_lifetime_points(50_000), "Platinum");
        assert_eq!(tier_for_lifetime_points(1_000_000), "Platinum");
    }

    #[test]
    fn next_tier_and_ranks() {
        assert_eq!(next_tier("Member"), Some(("Silver", 10_000)));
        assert_eq!(next_tier("Gold"), Some(("Platinum", 50_000)));
        assert_eq!(next_tier("Platinum"), None);
        assert!(tier_rank("Platinum") > tier_rank("Gold"));
        assert!(tier_rank("Silver") > tier_rank("Member"));
        assert_eq!(tier_rank("Titanium"), tier_rank("Platinum"));
    }
}
