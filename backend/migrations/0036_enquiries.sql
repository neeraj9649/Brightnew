-- Website contact-form enquiries (POST /public/enquiries).
-- Every enquiry is saved here first, then e-mailed to ENQUIRY_TO_EMAIL, so nothing is lost
-- when the mail server is down. email_sent / email_error record how the e-mail went.
-- Idempotent: only creates a new table and index. Nothing is updated or deleted.

CREATE TABLE IF NOT EXISTS enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(200) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'contact',  -- which website form sent it
    page_url VARCHAR(500),
    ip_address VARCHAR(64),
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    email_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enquiries_created_at ON enquiries (created_at DESC);
