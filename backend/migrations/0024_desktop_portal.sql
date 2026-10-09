-- Desktop portal: reward eligibility, booking conversations, referral invites
-- and a partner-offers notification preference.

ALTER TABLE reward_items
    ADD COLUMN min_tier VARCHAR(20) NOT NULL DEFAULT 'Silver'
        CHECK (min_tier IN ('Silver', 'Gold', 'Platinum', 'Titanium')),
    ADD COLUMN destination VARCHAR(80);

ALTER TABLE user_preferences
    ADD COLUMN partner_offers BOOLEAN NOT NULL DEFAULT FALSE;

-- Customer <-> advisor conversation on a booking ("Ask a question").
CREATE TABLE booking_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id),
    sender_role VARCHAR(10) NOT NULL CHECK (sender_role IN ('customer', 'staff')),
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_booking_messages_booking ON booking_messages(booking_id, created_at);

-- Friends a member invited by e-mail. An invite counts as "joined" once a
-- referred member registers with the same e-mail address.
CREATE TABLE referral_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (referrer_id, email)
);
