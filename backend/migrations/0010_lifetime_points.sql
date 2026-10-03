-- Tracks cumulative points ever earned (ignores redemption debits), used as
-- the basis for tier auto-upgrade so spending points never demotes a tier.
ALTER TABLE users ADD COLUMN lifetime_points_earned BIGINT NOT NULL DEFAULT 0;
