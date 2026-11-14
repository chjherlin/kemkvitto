-- Optional later step. Do not run this with the removal of the customer pay flow.
--
-- Customers pay at the laundry's own till. These columns only existed for
-- the removed per-receipt Stripe payment. amount_total stays, because it is
-- the optional price total on the receipt.
--
-- /api/webhooks/stripe still writes payment_status. Running this file before
-- that webhook is changed for the future laundry subscription will make
-- those webhook updates fail.

DROP INDEX IF EXISTS idx_receipts_payment_status;
DROP INDEX IF EXISTS idx_receipts_payment_intent;

ALTER TABLE receipts DROP COLUMN IF EXISTS payment_intent_id;
ALTER TABLE receipts DROP COLUMN IF EXISTS payment_status;
