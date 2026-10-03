-- "Lead" = a booking once assigned to an employee (confirmed: no separate
-- leads entity). NULL means unassigned; assignment is manual via the
-- existing admin/employee booking-update endpoint, no auto-assignment rule.
ALTER TABLE bookings ADD COLUMN assigned_employee_id UUID REFERENCES users(id);
CREATE INDEX idx_bookings_assigned_employee_id ON bookings(assigned_employee_id);

CREATE TABLE booking_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES users(id),
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_booking_notes_booking_id ON booking_notes(booking_id);

-- Links a file already uploaded via /uploads/booking-document to a booking,
-- rather than building a second upload path.
CREATE TABLE quotations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    file_id TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_quotations_booking_id ON quotations(booking_id);

-- A "follow-up" is just a task with a due date, so one table covers both
-- "Schedule Follow-Ups" and "Track Tasks" from the spec.
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'done', 'cancelled')),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_booking_id ON tasks(booking_id);
