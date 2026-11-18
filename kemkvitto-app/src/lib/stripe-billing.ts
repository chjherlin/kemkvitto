import type Stripe from "stripe";

export function subscriptionPeriodEnd(subscription: Stripe.Subscription): string | null {
  const end = subscription.items?.data?.[0]?.current_period_end;
  if (!end) return null;
  return new Date(end * 1000).toISOString();
}

export function subscriptionPriceCents(subscription: Stripe.Subscription): number | null {
  const amount = subscription.items?.data?.[0]?.price?.unit_amount;
  return typeof amount === "number" ? amount : null;
}

export function subscriptionInterval(subscription: Stripe.Subscription): "month" | "year" | null {
  const interval = subscription.items?.data?.[0]?.price?.recurring?.interval;
  if (interval === "month" || interval === "year") return interval;
  return null;
}

export function asId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}
