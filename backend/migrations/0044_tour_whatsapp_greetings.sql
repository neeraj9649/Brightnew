-- Keep the consent and delivery-dependent greeting state across backend restarts.
ALTER TABLE enquiries
    ADD COLUMN IF NOT EXISTS whatsapp_greeting_to VARCHAR(16),
    ADD COLUMN IF NOT EXISTS whatsapp_greeting_check_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS whatsapp_greeting_status TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp_greeting_message_sid TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp_greeting_error TEXT;

CREATE INDEX IF NOT EXISTS enquiries_whatsapp_greeting_due
    ON enquiries (whatsapp_greeting_check_at)
    WHERE whatsapp_greeting_check_at IS NOT NULL AND whatsapp_greeting_status IS NULL;
