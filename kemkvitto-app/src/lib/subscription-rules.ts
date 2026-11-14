export type BillingInterval = "month" | "year";

export function subscriptionAllowsAccess(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
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
