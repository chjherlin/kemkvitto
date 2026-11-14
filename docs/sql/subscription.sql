-- Proposal only. Kimmen runs this in Supabase. Do not apply it from the app.
-- There is no backfill. Existing test accounts should be deleted in Supabase
-- before this is used. Kimmen does that himself.
-- Adds subscription fields on washers. Does not disable RLS and does not add policies.
-- The app uses the service role and filters every washer query by the logged-in id.
-- Until these columns exist, nobody can pass the subscription gate.

ALTER TABLE washers ADD COLUMN IF NOT EXISTS country_code text;
ALTER TABLE washers ADD COLUMN IF NOT EXISTS locale text DEFAULT 'sv';
ALTER TABLE washers ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE washers ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE washers ADD COLUMN IF NOT EXISTS subscription_status text;
ALTER TABLE washers ADD COLUMN IF NOT EXISTS subscription_interval text;
ALTER TABLE washers ADD COLUMN IF NOT EXISTS current_period_end timestamptz;
ALTER TABLE washers ADD COLUMN IF NOT EXISTS price_amount_cents integer;
ALTER TABLE washers ADD COLUMN IF NOT EXISTS pending_price_amount_cents integer;
ALTER TABLE washers ADD COLUMN IF NOT EXISTS pending_price_effective_at timestamptz;
ALTER TABLE washers ADD COLUMN IF NOT EXISTS price_notice_sent_at timestamptz;
ALTER TABLE washers ADD COLUMN IF NOT EXISTS billing_country_code text;

CREATE UNIQUE INDEX IF NOT EXISTS washers_stripe_customer_id_key
  ON washers (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS washers_stripe_subscription_id_key
  ON washers (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
