-- Tag number and services on a receipt.
-- Kimmen runs this. Do not apply it from the app or from CI.
alter table public.receipts add column if not exists tag_number text, add column if not exists services jsonb not null default '[]'::jsonb;
