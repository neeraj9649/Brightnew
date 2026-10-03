-- Spec tiers are Silver (entry) / Gold / Platinum / Titanium -- there is no
-- Bronze tier. Bring the column default in line (table is currently empty).
ALTER TABLE users ALTER COLUMN membership_tier SET DEFAULT 'Silver';
UPDATE users SET membership_tier = 'Silver' WHERE membership_tier = 'Bronze';
