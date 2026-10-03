CREATE TABLE reward_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INT NOT NULL CHECK (points <> 0),
    reason VARCHAR(30) NOT NULL CHECK (reason IN (
        'welcome_bonus', 'first_booking', 'booking', 'manual', 'referral', 'redemption'
    )),
    source_type VARCHAR(50),
    source_id UUID,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reward_transactions_user_id ON reward_transactions(user_id, created_at DESC);
