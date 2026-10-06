-- Loyalty v2 normalizes the service reward keys used by the portal and makes
-- direct first-booking referral rewards idempotent per referred member.
INSERT INTO points_config (key, points) VALUES
    ('flight', 100),
    ('hotel', 100),
    ('car_rental', 100),
    ('visa', 200),
    ('tour', 500),
    ('cruise', 500),
    ('insurance', 50),
    ('airport_transfer', 50),
    ('activity', 50),
    ('custom', 500)
ON CONFLICT (key) DO NOTHING;

CREATE UNIQUE INDEX IF NOT EXISTS uq_referral_reward_source
    ON reward_transactions (source_type, source_id)
    WHERE reason = 'referral' AND source_id IS NOT NULL;
