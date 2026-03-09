-- Add payment tracking to receipts
ALTER TABLE receipts
  ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN payment_intent_id TEXT,
  ADD COLUMN amount_total INTEGER NOT NULL DEFAULT 0;

-- payment_status values: 'pending', 'paid', 'failed', 'expired'
-- amount_total is in SEK öre (cents), e.g. 25000 = 250 kr

CREATE INDEX idx_receipts_payment_status ON receipts(payment_status);
CREATE INDEX idx_receipts_payment_intent ON receipts(payment_intent_id) WHERE payment_intent_id IS NOT NULL;
