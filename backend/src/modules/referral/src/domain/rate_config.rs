/// Flat referral rate applied at every level of the chain, env-configurable
/// (`REFERRAL_RATE_PERCENT`), defaulting to 1.0 (meaning 1%).
pub fn referral_rate_percent() -> f64 {
    dotenv::dotenv().ok();
    std::env::var("REFERRAL_RATE_PERCENT")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(1.0)
}
