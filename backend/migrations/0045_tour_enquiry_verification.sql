-- Phone verification is isolated from account registration and passcode reset.
CREATE TABLE IF NOT EXISTS tour_enquiry_challenges (
    id UUID PRIMARY KEY,
    phone_key TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    sent BOOLEAN NOT NULL DEFAULT FALSE,
    attempts INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '10 minutes',
    enquiry_id UUID REFERENCES enquiries(id)
);

CREATE INDEX IF NOT EXISTS idx_tour_enquiry_challenges_phone
    ON tour_enquiry_challenges (phone_key, created_at DESC);
