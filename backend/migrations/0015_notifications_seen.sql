-- Tracks when the user last opened their notifications, so the unread badge
-- can be derived (notifications newer than this are unread). NULL = never seen.
ALTER TABLE users ADD COLUMN notifications_seen_at TIMESTAMPTZ;
