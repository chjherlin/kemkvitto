import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { listSubscribedWashers, updateWasherBilling } from "@/lib/billing";
import { priceCents, pricingConfig, type BillingInterval } from "@/lib/pricing";
import { priceNoticeEffectiveAt } from "@/lib/subscription-rules";
import { sendPriceChangeNotice } from "@/lib/subscription-notices";
import { subscriptionPriceCents } from "@/lib/stripe-billing";

export async function GET(request: Request) {
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const productId = process.env.STRIPE_SUBSCRIPTION_PRODUCT_ID;
  if (!productId || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe subscription is not configured" }, { status: 503 });
  }

  const listed = await listSubscribedWashers();
  if (!listed.ok) {
    return NextResponse.json({ error: listed.message }, { status: listed.missingColumns ? 503 : 500 });
  }

  const stripe = getStripe();
  const now = new Date();
  let scheduled = 0;
  let applied = 0;
  let cleared = 0;

  for (const washer of listed.washers) {
    const interval: BillingInterval = washer.subscription_interval === "year" ? "year" : "month";
    if (!washer.country_code || !washer.stripe_subscription_id) continue;
    const catalog = priceCents(washer.country_code, interval);
    if (catalog === null) continue;
    const current = washer.price_amount_cents;

    if (current === catalog) {
      if (washer.pending_price_amount_cents != null) {
        await updateWasherBilling(washer.id, {
          pending_price_amount_cents: null,
          pending_price_effective_at: null,
          price_notice_sent_at: null,
        });
        cleared++;
      }
      continue;
    }

    const pending = washer.pending_price_amount_cents;
    const effectiveAt = washer.pending_price_effective_at
      ? new Date(washer.pending_price_effective_at)
      : null;

    if (pending !== catalog || !effectiveAt) {
      const starts = priceNoticeEffectiveAt(now, pricingConfig.priceChangeNoticeDays);
      await updateWasherBilling(washer.id, {
        pending_price_amount_cents: catalog,
        pending_price_effective_at: starts.toISOString(),
        price_notice_sent_at: now.toISOString(),
      });
      try {
        await sendPriceChangeNotice({
          to: washer.email,
          locale: washer.locale,
          businessName: washer.business_name,
          fromEur: (current ?? catalog) / 100,
          toEur: catalog / 100,
          effectiveAt: starts,
        });
      } catch (err) {
        console.error(`Price notice failed washer=${washer.id}`, err);
      }
      scheduled++;
      continue;
    }

    if (effectiveAt.getTime() > now.getTime()) continue;

    const subscription = await stripe.subscriptions.retrieve(washer.stripe_subscription_id);
    const item = subscription.items.data[0];
    if (!item) continue;
    const price = await stripe.prices.create({
      product: productId,
      currency: pricingConfig.currency,
      unit_amount: catalog,
      recurring: { interval },
      metadata: { washer_id: washer.id, country_code: washer.country_code },
    });
    const updated = await stripe.subscriptions.update(washer.stripe_subscription_id, {
      items: [{ id: item.id, price: price.id }],
      proration_behavior: "none",
    });
    await updateWasherBilling(washer.id, {
      price_amount_cents: subscriptionPriceCents(updated) ?? catalog,
      pending_price_amount_cents: null,
      pending_price_effective_at: null,
      subscription_status: updated.status,
    });
    applied++;
  }

  return NextResponse.json({ scheduled, applied, cleared });
}
