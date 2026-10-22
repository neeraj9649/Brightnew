-- A reward voucher can be used once to book its trip (fully paid by the company).
-- The redemption points at the booking it paid for; ON DELETE SET NULL keeps the
-- redemption history intact if a booking is ever removed.
ALTER TABLE redemptions
    ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS voucher_used_at TIMESTAMPTZ;

-- One voucher, one booking -- and a booking can be backed by only one voucher.
CREATE UNIQUE INDEX IF NOT EXISTS idx_redemptions_booking_id
    ON redemptions(booking_id) WHERE booking_id IS NOT NULL;
