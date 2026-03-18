-- Allow receipt_number to hold arbitrary strings (e.g. "33-1-3", "A-42")
-- Previously integer; cast existing values to text.
ALTER TABLE receipts
  ALTER COLUMN receipt_number TYPE text USING receipt_number::text;
