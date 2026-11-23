-- Manual reminder time for the receipt list.
-- Kimmen runs this. Do not apply it from the app or from CI.
-- Old rows stay NULL, which means no reminder has been sent.
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;
