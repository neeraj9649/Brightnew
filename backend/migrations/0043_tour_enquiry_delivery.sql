-- Preserve the selected tour ID and the WhatsApp notification outcome.
ALTER TABLE enquiries
    ADD COLUMN IF NOT EXISTS tour_id UUID,
    ADD COLUMN IF NOT EXISTS whatsapp_message_sid TEXT,
    ADD COLUMN IF NOT EXISTS whatsapp_error TEXT;
