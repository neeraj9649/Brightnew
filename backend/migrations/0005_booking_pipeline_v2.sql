-- Align booking types with the 10 spec'd travel services and statuses with
-- the 8-stage spec pipeline (plus 'cancelled', kept from the existing cancel feature).
ALTER TABLE bookings DROP CONSTRAINT bookings_status_check;

UPDATE bookings SET status = 'new' WHERE status = 'pending';
UPDATE bookings SET status = 'booking_confirmed' WHERE status = 'confirmed';
UPDATE bookings SET status = 'cancelled' WHERE status = 'rejected';

ALTER TABLE bookings ALTER COLUMN status SET DEFAULT 'new';
ALTER TABLE bookings ADD CONSTRAINT bookings_status_check CHECK (status IN (
    'new', 'assigned', 'contacted', 'awaiting_approval', 'awaiting_payment',
    'payment_received', 'booking_confirmed', 'completed', 'cancelled'
));

ALTER TABLE bookings DROP CONSTRAINT bookings_type_check;
ALTER TABLE bookings ADD CONSTRAINT bookings_type_check CHECK (type IN (
    'flight', 'visa', 'tour', 'hotel', 'airport_transfer', 'cruise',
    'insurance', 'activity', 'car_rental', 'custom'
));
