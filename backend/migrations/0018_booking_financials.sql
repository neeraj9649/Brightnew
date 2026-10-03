-- Booking-detail extras: typed notes, document attachments, and per-booking
-- expense lines for PnL. Revenue for PnL = bookings.final_cost; per-booking
-- PnL = final_cost - SUM(expenses), computed in the app, not stored.

-- Communication vs support note distinction (existing rows default to
-- communication, so nothing breaks).
ALTER TABLE booking_notes
    ADD COLUMN note_type VARCHAR(20) NOT NULL DEFAULT 'communication'
    CHECK (note_type IN ('communication', 'support'));

-- Any file attached to a booking, typed by what it is. Quotations keep their
-- own table; tickets/vouchers/invoices/other live here. file_id points at an
-- already-uploaded file (same /uploads/booking-document path as quotations),
-- so view/download reuses the existing file URL.
CREATE TABLE booking_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    kind VARCHAR(20) NOT NULL
        CHECK (kind IN ('ticket', 'quotation', 'voucher', 'invoice', 'other')),
    file_id TEXT NOT NULL,
    label TEXT,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_booking_documents_booking ON booking_documents(booking_id);

-- Cost lines that make up a booking's package. A line with start/end dates
-- doubles as a "schedule" (a cab/hotel/flight leg); without dates it's a plain
-- expense. Every line is part of the package cost, so PnL per booking =
-- bookings.final_cost - SUM(amount).
CREATE TABLE booking_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    category VARCHAR(20) NOT NULL
        CHECK (category IN ('flight', 'hotel', 'cab', 'visa', 'activity', 'other')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    vendor TEXT,
    description TEXT,
    start_date DATE,
    end_date DATE,
    file_id TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_booking_expenses_booking ON booking_expenses(booking_id);
