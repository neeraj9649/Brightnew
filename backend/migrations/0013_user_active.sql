-- Employee (and any user) active/inactive flag. Inactive employees are kept
-- for the record but flagged in the admin Employees tab. Defaults to active.
ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;
