-- Deduplicate recently verified drafts and keep office notifications pending across restarts.
ALTER TABLE tour_enquiry_challenges ADD COLUMN IF NOT EXISTS draft_key TEXT;

CREATE INDEX IF NOT EXISTS tour_enquiry_verified_drafts
    ON tour_enquiry_challenges (draft_key, expires_at DESC)
    WHERE enquiry_id IS NOT NULL;

ALTER TABLE enquiries
    ADD COLUMN IF NOT EXISTS tour_notification JSONB,
    ADD COLUMN IF NOT EXISTS tour_notification_due_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS tour_notification_attempts INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS tour_notification_due
    ON enquiries (tour_notification_due_at) WHERE tour_notification_due_at IS NOT NULL;
