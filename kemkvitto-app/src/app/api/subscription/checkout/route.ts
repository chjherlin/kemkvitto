import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { loadWasherBilling } from "@/lib/billing";
import { isSoldCountry, priceCents, pricingConfig, type BillingInterval } from "@/lib/pricing";
import { reverseChargeNote, normalizeLocale } from "@/lib/subscription-notices";
import { subscriptionAllowsAccess } from "@/lib/subscription-rules";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const washerId = (session?.user as { id?: string } | undefined)?.id;
  if (!washerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const interval: BillingInterval = body.interval === "year" ? "year" : "month";

  const loaded = await loadWasherBilling(washerId);
  if (!loaded.ok) {
    return NextResponse.json(
      { error: loaded.missingColumns ? "Subscription columns are missing" : "Washer not found" },
      { status: loaded.missingColumns ? 503 : 404 }
    );
  }
  const washer = loaded.washer;
  if (!isSoldCountry(washer.country_code)) {
    return NextResponse.json({ error: "Country is not available" }, { status: 400 });
  }
  if (subscriptionAllowsAccess(washer.subscription_status)) {
    return NextResponse.json({ error: "Already subscribed" }, { status: 409 });
  }

  const productId = process.env.STRIPE_SUBSCRIPTION_PRODUCT_ID;
  if (!productId || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe subscription is not configured" }, { status: 503 });
  }

  const cents = priceCents(washer.country_code!, interval);
  if (!cents) {
    return NextResponse.json({ error: "Country is not available" }, { status: 400 });
  }

  const locale = normalizeLocale(washer.locale);
  const origin = process.env.NEXTAUTH_URL || new URL(request.url).origin;
  const stripe = getStripe();

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: washer.stripe_customer_id || undefined,
    customer_email: washer.stripe_customer_id ? undefined : washer.email,
    client_reference_id: washerId,
    billing_address_collection: "required",
    payment_method_collection: "always",
    // Stripe SDK 20.4.1 only allows "if_supported" or "never". if_supported is the
    // strictest: Checkout requires a tax ID when the billing country has one.
    tax_id_collection: { enabled: true, required: "if_supported" },
    customer_update: washer.stripe_customer_id ? { address: "auto", name: "auto" } : undefined,
    custom_text: { submit: { message: reverseChargeNote(locale) } },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: pricingConfig.currency,
          unit_amount: cents,
          product: productId,
          recurring: { interval },
        },
      },
    ],
    subscription_data: {
      trial_period_days: pricingConfig.trialDays,
      description: reverseChargeNote(locale),
      metadata: {
        washer_id: washerId,
        country_code: washer.country_code!,
        interval,
      },
    },
    metadata: {
      washer_id: washerId,
      country_code: washer.country_code!,
      interval,
      amount_cents: String(cents),
      locale,
    },
    success_url: `${origin}/subscribe?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/subscribe?checkout=cancel`,
  });

  return NextResponse.json({ url: checkout.url });
}
