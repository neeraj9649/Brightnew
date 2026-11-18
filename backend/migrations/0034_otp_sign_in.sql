-- Sign-in and sign-up use a one-time code sent to the phone instead of a PIN.
-- One row per code sent. `channel` says who checks it:
--   'twilio' -> Twilio Verify holds the code (code_hash stays NULL)
--   'local'  -> fallback code generated here and e-mailed; only its SHA-256 hash is stored
-- users.pin_hash and pin_reset_requests are left in place (no longer used).
CREATE TABLE IF NOT EXISTS otp_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) NOT NULL,
    purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('login', 'register')),
    channel VARCHAR(10) NOT NULL CHECK (channel IN ('twilio', 'local')),
    code_hash VARCHAR(64),
    attempts INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_requests_phone
    ON otp_requests(phone, purpose, created_at DESC);
