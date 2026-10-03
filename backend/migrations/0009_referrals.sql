ALTER TABLE users ADD COLUMN referral_code VARCHAR(20) UNIQUE;

-- referred_id is UNIQUE: each customer has at most one referrer, fixed at
-- registration. This makes the graph a forest of trees with no possibility
-- of cycles, so the monthly payout walk never needs cycle detection.
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);

-- Guards against accidentally running the same month's payout twice.
CREATE TABLE referral_payout_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    users_paid INT NOT NULL,
    total_points_paid BIGINT NOT NULL,
    run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (period_start, period_end)
);
