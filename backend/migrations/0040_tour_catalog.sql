-- New catalogue records are classified explicitly. Legacy rows and their reviews are preserved.
ALTER TABLE tours
    ADD COLUMN IF NOT EXISTS package_type TEXT CHECK (package_type IN ('individual', 'holiday')),
    ADD COLUMN IF NOT EXISTS presentation JSONB NOT NULL DEFAULT '{}'::jsonb;
