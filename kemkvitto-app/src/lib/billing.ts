import { createServiceClient } from "./supabase";

export interface WasherBilling {
  id: string;
  email: string;
  business_name: string;
  country_code: string | null;
  locale: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  subscription_interval: string | null;
  current_period_end: string | null;
  price_amount_cents: number | null;
  pending_price_amount_cents: number | null;
  pending_price_effective_at: string | null;
  billing_country_code: string | null;
  vat_number: string | null;
  vat_verification: string | null;
}

const BILLING_SELECT =
  "id, email, business_name, country_code, locale, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_interval, current_period_end, price_amount_cents, pending_price_amount_cents, pending_price_effective_at, billing_country_code, vat_number, vat_verification";

function missingColumn(code: string | undefined): boolean {
  return code === "42703" || code === "PGRST204";
}

export async function loadWasherBilling(washerId: string): Promise<
  | { ok: true; washer: WasherBilling }
  | { ok: false; missingColumns: boolean }
> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("washers")
    .select(BILLING_SELECT)
    .eq("id", washerId)
    .single();

  if (missingColumn(error?.code)) return { ok: false, missingColumns: true };
  if (error || !data) return { ok: false, missingColumns: false };
  return { ok: true, washer: data as WasherBilling };
}

export async function updateWasherBilling(
  washerId: string,
  patch: Record<string, unknown>
): Promise<{ ok: true } | { ok: false; missingColumns: boolean; message: string }> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("washers").update(patch).eq("id", washerId);
  if (!error) return { ok: true };
  return {
    ok: false,
    missingColumns: missingColumn(error.code),
    message: error.message,
  };
}

export async function listSubscribedWashers(): Promise<
  | { ok: true; washers: WasherBilling[] }
  | { ok: false; missingColumns: boolean; message: string }
> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("washers")
    .select(BILLING_SELECT)
    .in("subscription_status", ["active", "trialing"])
    .not("stripe_subscription_id", "is", null);

  if (error) {
    return { ok: false, missingColumns: missingColumn(error.code), message: error.message };
  }
  return { ok: true, washers: (data || []) as WasherBilling[] };
}

export async function findWasherIdByCustomer(customerId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("washers")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  if (error || !data) return null;
  return data.id as string;
}
