-- Staff workflow: who recorded a booking, customer-facing booking steps, Wings requests that need
-- admin approval, and offers shown to customers.

-- The staff member who recorded the booking on the customer's behalf (NULL = booked by the customer).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS recorded_by UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_recorded_by ON bookings(recorded_by);

-- What the customer needs to do / what will happen, step by step, for one booking.
CREATE TABLE booking_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    title VARCHAR(160) NOT NULL,
    details TEXT,
    status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX idx_booking_steps_booking ON booking_steps(booking_id, position);

-- Manually entered Wings (beyond the automatic per-service amounts) wait here for an admin to approve.
CREATE TABLE wings_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES users(id),
    points INT NOT NULL CHECK (points > 0 AND points <= 100000),
    reason TEXT NOT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES users(id),
    review_note TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_wings_requests_status ON wings_requests(status, created_at DESC);
CREATE INDEX idx_wings_requests_booking ON wings_requests(booking_id);

-- Offers staff and admins publish; customers see the active ones inside the portal.
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(120) NOT NULL,
    description TEXT,
    badge VARCHAR(40),
    code VARCHAR(40),
    image_file_id TEXT,
    service_type VARCHAR(20),
    valid_from DATE,
    valid_until DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_offers_active ON offers(is_active, valid_until);
