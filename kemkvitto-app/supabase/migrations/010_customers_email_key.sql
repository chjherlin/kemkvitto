-- Customers are identified by email. The table is empty.
-- Kimmen runs this. Do not apply it from the app or from CI.

ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_washer_id_name_key;

ALTER TABLE public.customers ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.customers ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE public.customers ALTER COLUMN email DROP DEFAULT;
ALTER TABLE public.customers ALTER COLUMN email SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS customers_washer_lower_email_key
  ON public.customers (washer_id, lower(email));
