-- Keep the submitted contact subject alongside the enquiry for staff follow-up.
ALTER TABLE enquiries ADD COLUMN IF NOT EXISTS subject VARCHAR(120);
