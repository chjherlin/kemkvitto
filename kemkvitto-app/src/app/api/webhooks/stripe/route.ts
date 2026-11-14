import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase";
import { findWasherIdByCustomer, updateWasherBilling } from "@/lib/billing";
import { billingCountryMatches } from "@/lib/subscription-rules";
import { reverseChargeNote, normalizeLocale } from "@/lib/subscription-notices";
import { asId, subscriptionInterval, subscriptionPeriodEnd, subscriptionPriceCents } from "@/lib/stripe-billing";

async function resolveWasherId(metadata: Stripe.Metadata | null | undefined, customerId: string | null): Promise<string | null> {
  const fromMetadata = metadata?.washer_id;
  if (fromMetadata) return fromMetadata;
  if (!customerId) return null;
  return findWasherIdByCustomer(customerId);
}

async function saveSubscription(washerId: string, subscription: Stripe.Subscription, customerId: string | null) {
  await updateWasherBilling(washerId, {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    subscription_status: subscription.status,
    subscription_interval: subscriptionInterval(subscription),
    current_period_end: subscriptionPeriodEnd(subscription),
    price_amount_cents: subscriptionPriceCents(subscription),
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe webhook verification failed:", message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const supabase = createServiceClient();

  switch (event.type) {
    case "payment_intent.succeeded":
    case "payment_intent.payment_failed": {
      // Leftover receipt-payment events. Subscriptions do not use them.
      const pi = event.data.object as Stripe.PaymentIntent;
      const receiptId = pi.metadata.receipt_id;
      if (receiptId) {
        await supabase
          .from("receipts")
          .update({ payment_status: event.type === "payment_intent.succeeded" ? "paid" : "failed" })
          .eq("id", receiptId);
      }
      break;
    }

    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;
      const customerId = asId(session.customer);
      const subscriptionId = asId(session.subscription);
      const washerId = await resolveWasherId(session.metadata, customerId);
      if (!washerId || !subscriptionId) break;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const billingCountry = session.customer_details?.address?.country || null;
      const expected = session.metadata?.country_code || null;
      const locale = normalizeLocale(session.metadata?.locale);

      if (customerId) {
        await stripe.customers.update(customerId, {
          invoice_settings: { footer: reverseChargeNote(locale) },
        });
      }

      if (!billingCountryMatches(expected, billingCountry)) {
        await stripe.subscriptions.update(subscriptionId, {
          metadata: { ...subscription.metadata, country_mismatch: "1", washer_id: washerId },
        });
        await stripe.subscriptions.cancel(subscriptionId);
        await updateWasherBilling(washerId, {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: "country_mismatch",
          billing_country_code: billingCountry,
        });
        console.log(`Subscription country mismatch washer=${washerId}`);
        break;
      }

      await saveSubscription(washerId, subscription, customerId);
      await updateWasherBilling(washerId, { billing_country_code: billingCountry });
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = asId(subscription.customer);
      const washerId = await resolveWasherId(subscription.metadata, customerId);
      if (!washerId) break;
      if (subscription.metadata?.country_mismatch === "1") {
        await updateWasherBilling(washerId, {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          subscription_status: "country_mismatch",
        });
        break;
      }
      await saveSubscription(washerId, subscription, customerId);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = asId(subscription.customer);
      const washerId = await resolveWasherId(subscription.metadata, customerId);
      if (!washerId) break;
      const mismatch = subscription.metadata?.country_mismatch === "1";
      await updateWasherBilling(washerId, {
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        subscription_status: mismatch ? "country_mismatch" : "canceled",
        current_period_end: subscriptionPeriodEnd(subscription),
      });
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = asId(invoice.customer);
      const washerId = customerId ? await findWasherIdByCustomer(customerId) : null;
      if (!washerId) break;
      await updateWasherBilling(washerId, { subscription_status: "past_due" });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
