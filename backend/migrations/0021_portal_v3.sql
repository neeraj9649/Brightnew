-- Portal v3: PIN recovery, member preferences, structured quotations,
-- booking activity timeline, and richer rewards/redemptions.

-- ---- PIN recovery ----------------------------------------------------------
-- One row per "forgot PIN" request. The 6-digit code and the follow-up reset
-- token are stored only as SHA-256 hashes.
CREATE TABLE pin_reset_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash VARCHAR(64) NOT NULL,
    attempts INT NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    verified_at TIMESTAMPTZ,
    reset_token_hash VARCHAR(64),
    reset_token_expires_at TIMESTAMPTZ,
    consumed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_pin_reset_user ON pin_reset_requests(user_id, created_at DESC);

-- ---- Member preferences ------------------------------------------------------
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    departure_city VARCHAR(80),
    travel_style VARCHAR(40),
    travelling_with VARCHAR(40),
    trip_updates BOOLEAN NOT NULL DEFAULT TRUE,
    wings_activity BOOLEAN NOT NULL DEFAULT TRUE,
    reward_status BOOLEAN NOT NULL DEFAULT TRUE,
    travel_offers BOOLEAN NOT NULL DEFAULT FALSE,
    channel_sms BOOLEAN NOT NULL DEFAULT TRUE,
    channel_in_app BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---- Structured quotations ---------------------------------------------------
-- Staff compose a quote (fare lines, inclusions, validity); the customer
-- reviews it in the portal and accepts it or asks for a change.
CREATE TABLE booking_quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    base_fare NUMERIC(12, 2) NOT NULL CHECK (base_fare >= 0),
    taxes NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (taxes >= 0),
    total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    valid_until TIMESTAMPTZ,
    inclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
    exclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    private_note TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'sent'
        CHECK (status IN ('draft', 'sent', 'accepted', 'change_requested', 'superseded')),
    change_note TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);
CREATE INDEX idx_booking_quotes_booking ON booking_quotes(booking_id, created_at DESC);

-- ---- Booking activity timeline ---------------------------------------------
CREATE TABLE booking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    kind VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_booking_events_booking ON booking_events(booking_id, created_at);

CREATE OR REPLACE FUNCTION log_booking_event() RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO booking_events (booking_id, actor_id, kind, message, created_at)
        VALUES (NEW.id, NEW.user_id, 'created', 'Booking request received', NEW.created_at);
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            INSERT INTO booking_events (booking_id, kind, message)
            VALUES (NEW.id, 'status', 'Status updated to ' || NEW.status);
        END IF;
        IF NEW.assigned_employee_id IS DISTINCT FROM OLD.assigned_employee_id
           AND NEW.assigned_employee_id IS NOT NULL THEN
            INSERT INTO booking_events (booking_id, kind, message)
            VALUES (NEW.id, 'assigned', 'Assigned to a travel advisor');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bookings_events
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION log_booking_event();

-- Backfill a "created" event for existing bookings.
INSERT INTO booking_events (booking_id, actor_id, kind, message, created_at)
SELECT id, user_id, 'created', 'Booking request received', created_at FROM bookings;

-- ---- Rewards catalog ---------------------------------------------------------
ALTER TABLE reward_items
    ADD COLUMN validity_days INT NOT NULL DEFAULT 90 CHECK (validity_days > 0),
    ADD COLUMN terms TEXT,
    ADD COLUMN stock INT CHECK (stock IS NULL OR stock >= 0),
    ADD COLUMN reward_value TEXT,
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ---- Redemptions ---------------------------------------------------------------
CREATE SEQUENCE redemption_display_seq START 1;

ALTER TABLE redemptions
    ADD COLUMN display_code VARCHAR(20),
    ADD COLUMN valid_till DATE,
    ADD COLUMN approved_at TIMESTAMPTZ,
    ADD COLUMN issued_at TIMESTAMPTZ,
    ADD COLUMN delivered_at TIMESTAMPTZ,
    ADD COLUMN rejected_at TIMESTAMPTZ;

UPDATE redemptions SET display_code = 'BW-RD-' || LPAD(nextval('redemption_display_seq')::text, 4, '0')
WHERE display_code IS NULL;

ALTER TABLE redemptions
    ALTER COLUMN display_code SET DEFAULT 'BW-RD-' || LPAD(nextval('redemption_display_seq')::text, 4, '0'),
    ALTER COLUMN display_code SET NOT NULL;
CREATE UNIQUE INDEX idx_redemptions_display_code ON redemptions(display_code);
