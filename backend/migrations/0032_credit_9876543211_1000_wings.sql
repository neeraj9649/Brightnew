-- One-time credit of 1000 Wings to the explicitly approved account 9876543211.
-- Credit-only: it never creates an account, changes a PIN or role, or touches any
-- other user. It does nothing if the account is not registered in this environment.
-- Mirrors RewardTransactionSqlxRepository::create (balance + lifetime counter +
-- ledger row in one statement chain). The 'migration_0032' ledger marker makes it
-- credit exactly once even if it is ever re-applied. 1000 never crosses a tier
-- threshold on its own, but the tier is re-evaluated below in case the account
-- is already near one.
WITH target AS (
    SELECT id FROM users
     WHERE phone = '9876543211'
       AND NOT EXISTS (
           SELECT 1 FROM reward_transactions t
            WHERE t.user_id = users.id AND t.source_type = 'migration_0032'
       )
),
credited AS (
    UPDATE users u
       SET tokens = u.tokens + 1000,
           lifetime_points_earned = u.lifetime_points_earned + 1000
      FROM target
     WHERE u.id = target.id
    RETURNING u.id
)
INSERT INTO reward_transactions (user_id, points, reason, source_type, description)
SELECT id, 1000, 'manual', 'migration_0032', 'Manual credit of 1000 Wings'
  FROM credited;

-- Tier upgrade (never a downgrade) using the default ladder thresholds.
UPDATE users
   SET membership_tier = CASE
         WHEN lifetime_points_earned >= 50000 THEN 'Platinum'
         WHEN lifetime_points_earned >= 20000 THEN 'Gold'
         WHEN lifetime_points_earned >= 10000 THEN 'Silver'
         ELSE membership_tier END
 WHERE phone = '9876543211'
   AND membership_tier = 'Member'
   AND lifetime_points_earned >= 10000;
