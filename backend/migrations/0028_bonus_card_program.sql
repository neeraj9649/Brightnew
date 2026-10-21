-- Bright Wings Elite Card – Bonus Card Program.
--   * earning rates (points_config)
--   * membership levels by lifetime points: Member (entry) → Silver 10,000 → Gold 20,000 → Platinum 50,000
--     (Titanium is retired; members who held it become Platinum)
--   * the rewards catalogue ("Value of your reward points")
-- Earlier migrations are untouched; everything here is safe to re-run.

-- ---- Earning rates -------------------------------------------------------------------------------
-- Keys not listed (hotel, cruise, insurance, custom) keep their current value.
INSERT INTO points_config (key, points) VALUES
    ('welcome_bonus', 200),      -- new member registration
    ('first_booking', 300),      -- first booking
    ('referral_booking', 50),    -- refer a friend (after the friend's first booking) / booking received through referral
    ('flight', 100),             -- air ticket booking
    ('visa', 200),               -- visa service
    ('activity', 50),            -- activity ticket booking
    ('airport_transfer', 50),    -- airport pickup / drop service
    ('tour', 500),               -- tour package booking
    ('holiday_package', 500),    -- holiday package booking
    ('office_visit', 100),       -- office visit
    ('car_rental', 100)          -- car hire
ON CONFLICT (key) DO UPDATE SET points = EXCLUDED.points;

-- ---- Membership levels -----------------------------------------------------------------------------
ALTER TABLE users ALTER COLUMN membership_tier SET DEFAULT 'Member';

-- Re-level every member from the points they have earned over their lifetime.
UPDATE users
   SET membership_tier = CASE
        WHEN lifetime_points_earned >= 50000 THEN 'Platinum'
        WHEN lifetime_points_earned >= 20000 THEN 'Gold'
        WHEN lifetime_points_earned >= 10000 THEN 'Silver'
        ELSE 'Member'
       END
 WHERE membership_tier IS DISTINCT FROM CASE
        WHEN lifetime_points_earned >= 50000 THEN 'Platinum'
        WHEN lifetime_points_earned >= 20000 THEN 'Gold'
        WHEN lifetime_points_earned >= 10000 THEN 'Silver'
        ELSE 'Member'
       END;

-- Rewards used "Silver" to mean "open to everyone"; that is now the Member level.
ALTER TABLE reward_items DROP CONSTRAINT IF EXISTS reward_items_min_tier_check;
UPDATE reward_items SET min_tier = 'Platinum' WHERE min_tier = 'Titanium';
UPDATE reward_items SET min_tier = 'Member' WHERE min_tier = 'Silver';
ALTER TABLE reward_items ALTER COLUMN min_tier SET DEFAULT 'Member';
ALTER TABLE reward_items ADD CONSTRAINT reward_items_min_tier_check
    CHECK (min_tier IN ('Member', 'Silver', 'Gold', 'Platinum'));

-- ---- Rewards catalogue -----------------------------------------------------------------------------
-- Update-or-insert each program reward by name, then retire every other catalogue item (kept, not deleted,
-- because redemptions refer to them). A DO block keeps this independent of how the file is executed.
DO $$
DECLARE
    r RECORD;
    kept TEXT[] := ARRAY[]::TEXT[];
BEGIN
    FOR r IN
        SELECT * FROM (VALUES
            ('Free Dhow Cruise', 'A dhow cruise on us.', 'Experiences', 1000, 90,
             E'Subject to availability.\nBooking is arranged through Bright Wings.\nNot exchangeable for cash.',
             'Free Dhow Cruise', 'Dubai'),
            ('Free Desert Safari', 'A desert safari on us.', 'Experiences', 5000, 90,
             E'Subject to availability.\nBooking is arranged through Bright Wings.\nNot exchangeable for cash.',
             'Free Desert Safari', 'Dubai'),
            ('MOTF Ticket', 'An entry ticket to the Museum of the Future.', 'Tickets', 7500, 90,
             E'Subject to availability.\nBooking is arranged through Bright Wings.\nNot exchangeable for cash.',
             'MOTF Ticket', 'Dubai'),
            ('Silver Membership + Free Musandam Tour', 'Silver membership and a Musandam tour.', 'Membership', 10000, 180,
             E'Includes Silver membership benefits.\nThe Musandam tour is subject to availability and arranged through Bright Wings.\nNot exchangeable for cash.',
             'Silver Membership + Free Musandam Tour', 'Musandam'),
            ('Gold Membership + Free Air Ticket to Home Country', 'Gold membership and an air ticket to your home country.', 'Membership', 20000, 365,
             E'Includes Gold membership benefits.\nThe air ticket is to the member''s home country, subject to availability and arranged through Bright Wings.\nNot exchangeable for cash.',
             'Gold Membership + Free Air Ticket to Home Country', 'Home country'),
            ('Platinum Membership + Free Family Tour Package (1 member only, 3 Nights / 4 Days)',
             'Platinum membership and a 3 night / 4 day family tour package for 1 member.', 'Membership', 50000, 365,
             E'Includes Platinum membership benefits.\nThe family tour package is for 1 member only, 3 nights / 4 days.\nSubject to availability and arranged through Bright Wings.\nNot exchangeable for cash.',
             'Platinum Membership + Free Family Tour Package', 'Family tour')
        ) AS v(name, description, category, wings_cost, validity_days, terms, reward_value, destination)
    LOOP
        kept := kept || r.name;
        UPDATE reward_items
           SET description = r.description, category = r.category, wings_cost = r.wings_cost, validity_days = r.validity_days,
               terms = r.terms, reward_value = r.reward_value, destination = r.destination,
               min_tier = 'Member', stock = NULL, is_active = TRUE, updated_at = NOW()
         WHERE name = r.name;
        IF NOT FOUND THEN
            INSERT INTO reward_items (name, description, category, wings_cost, validity_days, terms, reward_value, destination, min_tier, is_active)
            VALUES (r.name, r.description, r.category, r.wings_cost, r.validity_days, r.terms, r.reward_value, r.destination, 'Member', TRUE);
        END IF;
    END LOOP;

    UPDATE reward_items SET is_active = FALSE, updated_at = NOW()
     WHERE is_active AND name <> ALL (kept);
END
$$;
