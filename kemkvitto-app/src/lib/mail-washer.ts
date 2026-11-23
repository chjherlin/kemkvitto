import type { WasherInfo } from "./email";

interface Row {
  business_name?: string;
  brand_color?: string;
  price_list?: Record<string, number>;
  locale?: string | null;
}

/** Loads the fields an email needs. Locale is optional until that column exists. */
export async function loadMailWasher(
  // The Supabase builder is thenable but not a Promise, and its generics blow up if named here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  washerId: string
): Promise<WasherInfo | undefined> {
  const full = await supabase
    .from("washers")
    .select("business_name, brand_color, price_list, locale")
    .eq("id", washerId)
    .single();

  let row = full.data as Row | null;
  if (full.error?.code === "42703" || full.error?.code === "PGRST204") {
    const base = await supabase
      .from("washers")
      .select("business_name, brand_color, price_list")
      .eq("id", washerId)
      .single();
    row = base.data;
  }
  if (!row) return undefined;
  return {
    business_name: row.business_name || "",
    brand_color: row.brand_color || "",
    price_list: row.price_list || {},
    locale: row.locale ?? null,
  };
}
