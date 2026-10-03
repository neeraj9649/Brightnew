-- Admin-editable reward point amounts: how many Wings each booking service
-- awards, plus the welcome and first-booking bonuses. Previously env-only
-- (REWARD_POINTS_*); now DB-backed so admins can tune them at runtime from the
-- dashboard.
--
-- Keys:
--   flight
--   hotel
--   holiday_package
--   tour
--   visa
--   airport_transfer
--   activity
--   car_rental
--   office_visit
--   referral_booking
--   welcome_bonus
--   first_booking
--
-- Note:
-- Friend referral bonus (50 Wings after the referred user's first booking)
-- is handled separately from booking rewards and is not included here.

CREATE TABLE points_config (
    key    TEXT PRIMARY KEY,
    points INTEGER NOT NULL CHECK (points >= 0)
);

INSERT INTO points_config (key, points) VALUES
    ('flight', 100),
    ('hotel', 100),
    ('holiday_package', 500),
    ('tour', 500),
    ('visa', 200),
    ('airport_transfer', 50),
    ('activity', 50),
    ('car_rental', 100),
    ('office_visit', 100),
    ('referral_booking', 50),
    ('welcome_bonus', 200),
    ('first_booking', 300);
