-- Airports offered in the flight booking form (From / To suggestions).
-- The portal shows each one as "Name (CODE)", the same format bookings already store in
-- details.from / details.to, so existing bookings are unaffected.
-- Idempotent: the table is created once and rows are only added (ON CONFLICT DO NOTHING keeps any
-- later edit to a row). Nothing is updated or deleted.

CREATE TABLE IF NOT EXISTS airports (
    code VARCHAR(3) PRIMARY KEY CHECK (code ~ '^[A-Z]{3}$'),  -- IATA code
    name VARCHAR(100) NOT NULL CHECK (length(trim(name)) > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO airports (code, name, sort_order) VALUES
    ('DXB', 'Dubai', 1),
    ('MNL', 'Manila', 2),
    ('MAA', 'Chennai', 3),
    ('SIN', 'Singapore', 4),
    ('KUL', 'Kuala Lumpur', 5),
    ('TRZ', 'Tiruchirapally', 6),
    ('BLR', 'Bangalore', 7),
    ('CCU', 'Kolkata', 8),
    ('MCT', 'Muscat', 9),
    ('LHE', 'Lahore', 10),
    ('ISB', 'Islamabad', 11),
    ('KWI', 'Kuwait', 12),
    ('TRV', 'Thiruvananthapuram', 13),
    ('AUH', 'Abu Dhabi', 14),
    ('SHJ', 'Sharjah', 15),
    ('DAC', 'Dhaka', 16),
    ('CGP', 'Chittagong', 17),
    ('CCJ', 'Kozhikode', 18),
    ('DOH', 'Doha', 19),
    ('CNN', 'Kannur', 20),
    ('COK', 'Cochin', 21),
    ('BKK', 'Bangkok', 22),
    ('DEL', 'New Delhi', 23),
    ('SKT', 'Sialkot', 24),
    ('BOM', 'Mumbai', 25),
    ('PEW', 'Peshawar', 26),
    ('MUX', 'Multan', 27),
    ('IXE', 'Mangalore', 28),
    ('BAH', 'Bahrain', 29),
    ('RUH', 'Riyadh', 30),
    ('UET', 'Quetta', 31),
    ('LKO', 'Lucknow', 32),
    ('AAN', 'Al Ain', 33),
    ('ATQ', 'Amritsar', 34),
    ('VNS', 'Varanasi', 35),
    ('CMB', 'Colombo', 36),
    ('RKT', 'Ras Al Khaimah', 37),
    ('HYD', 'Hyderabad', 38),
    ('TIF', 'Taif', 39),
    ('ADD', 'Addis Ababa', 40),
    ('JED', 'Jeddah', 41),
    ('MED', 'Madinah', 42),
    ('PZU', 'Port Sudan', 43),
    ('DMM', 'Dammam', 44),
    -- Already offered by the portal before this table existed, kept so no option disappears.
    ('JAI', 'Jaipur', 45),
    ('UDR', 'Udaipur', 46),
    ('GOI', 'Goa', 47),
    ('AMD', 'Ahmedabad', 48),
    ('PNQ', 'Pune', 49),
    ('SXR', 'Srinagar', 50),
    ('IXL', 'Leh', 51),
    ('LHR', 'London', 52)
ON CONFLICT (code) DO NOTHING;
