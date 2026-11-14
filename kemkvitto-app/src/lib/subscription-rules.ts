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
