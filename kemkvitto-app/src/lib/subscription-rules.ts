export type BillingInterval = "month" | "year";

export const SUBSCRIPTION_CHECK_TTL_MS = 5 * 60 * 1000;

export function subscriptionAllowsAccess(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

/** True when the JWT already proves access and does not need a database read. */
export function tokenGrantsAccess(input: {
  status: string | null | undefined;
  checkedAt: number | null | undefined;
  periodEnd: string | null | undefined;
  now: number;
}): boolean {
  if (!subscriptionAllowsAccess(input.status)) return false;
  if (typeof input.checkedAt !== "number") return false;
  if (input.now - input.checkedAt > SUBSCRIPTION_CHECK_TTL_MS) return false;
  if (input.periodEnd && Date.parse(input.periodEnd) <= input.now) return false;
  return true;
}

export function billingCountryMatches(
  registeredCountry: string | null | undefined,
  billingCountry: string | null | undefined
): boolean {
  if (!registeredCountry || !billingCountry) return false;
  return registeredCountry.toUpperCase() === billingCountry.toUpperCase();
}

/** EU members whose business VAT id is Stripe type eu_vat. Greece's prefix is EL. */
const EU_ISO = new Set([
  "AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR",
  "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO",
  "SE", "SI", "SK",
]);

export type VatVerification = "pending" | "verified" | "unverified" | "unavailable" | "unknown";

export interface TaxIdInput {
  type: string;
  value: string | null | undefined;
  country?: string | null;
  verificationStatus?: string | null;
}

export type VatCheck =
  | { ok: true; vatNumber: string; verificationStatus: VatVerification }
  | { ok: false; status: "vat_missing" | "country_mismatch" };

function euPrefixCountry(value: string): string | null {
  const prefix = value.replace(/[^A-Za-z0-9]/g, "").slice(0, 2).toUpperCase();
  if (!/^[A-Z]{2}$/.test(prefix)) return null;
  if (prefix === "EL") return "GR";
  return prefix;
}

function inferredTaxCountry(id: TaxIdInput): string | null {
  if (id.type === "eu_vat" && id.value) return euPrefixCountry(id.value);
  if (id.type === "gb_vat") return "GB";
  if (id.type === "no_vat") return "NO";
  if (id.country && /^[A-Za-z]{2}$/.test(id.country)) return id.country.toUpperCase();
  return null;
}

function conflicts(id: TaxIdInput, registered: string, billing: string): boolean {
  const country = inferredTaxCountry(id);
  if (!country) return false;
  if (country !== registered) return true;
  if (billing && country !== billing) return true;
  return false;
}

function satisfies(id: TaxIdInput, registered: string, billing: string): boolean {
  if (conflicts(id, registered, billing)) return false;
  if (EU_ISO.has(registered)) {
    return id.type === "eu_vat" && euPrefixCountry(id.value || "") === registered && (!billing || billing === registered);
  }
  if (registered === "GB") return id.type === "gb_vat" && (!billing || billing === "GB");
  if (registered === "NO") return id.type === "no_vat" && (!billing || billing === "NO");
  return true;
}

function verificationOf(status: string | null | undefined): VatVerification {
  if (status === "pending" || status === "verified" || status === "unverified" || status === "unavailable") {
    return status;
  }
  return "unknown";
}

/**
 * A business tax ID is required. EU countries need eu_vat with that country's
 * prefix, the UK needs gb_vat, and Norway needs no_vat. Other countries accept
 * any collected tax ID, and a country is checked only when the id reveals one.
 * Pending or unavailable verification does not reject the id.
 */
export function assessBusinessTaxId(input: {
  taxIds: TaxIdInput[];
  registeredCountry: string | null | undefined;
  billingCountry?: string | null;
}): VatCheck {
  const present = input.taxIds.filter((id) => id.type && id.value && id.value.trim());
  const registered = (input.registeredCountry || "").toUpperCase();
  const billing = (input.billingCountry || "").toUpperCase();
  if (!registered || present.length === 0) return { ok: false, status: "vat_missing" };

  const matching = present.filter((id) => satisfies(id, registered, billing));
  if (matching.length > 0) {
    const chosen = matching[0];
    return {
      ok: true,
      vatNumber: chosen.value!.trim(),
      verificationStatus: verificationOf(chosen.verificationStatus),
    };
  }
  if (present.some((id) => conflicts(id, registered, billing))) {
    return { ok: false, status: "country_mismatch" };
  }
  return { ok: false, status: "vat_missing" };
}

export function priceNoticeEffectiveAt(from: Date, days = 30): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

export function catalogCentsForInterval(
  monthlyCents: number,
  yearlyCents: number,
  interval: BillingInterval
): number {
  return interval === "year" ? yearlyCents : monthlyCents;
}
