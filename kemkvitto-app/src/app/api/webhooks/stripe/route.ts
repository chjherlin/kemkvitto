import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase";
import { findWasherIdByCustomer, loadWasherBilling, updateWasherBilling } from "@/lib/billing";
import { assessBusinessTaxId, billingCountryMatches, type TaxIdInput } from "@/lib/subscription-rules";
import { reverseChargeNote, normalizeLocale } from "@/lib/subscription-notices";
import { asId, subscriptionInterval, subscriptionPeriodEnd, subscriptionPriceCents } from "@/lib/stripe-billing";

async function resolveWasherId(metadata: Stripe.Metadata | null | undefined, customerId: string | null): Promise<string | null> {
  const fromMetadata = metadata?.washer_id;
  if (fromMetadata) return fromMetadata;
  if (!customerId) return null;
  return findWasherIdByCustomer(customerId);
}

function toTaxInput(id: { type: string; value?: string | null; country?: string | null; verification?: { status?: string | null } | null }): TaxIdInput {
  return {
    type: id.type,
    value: id.value,
    country: id.country,
    verificationStatus: id.verification?.status,
  };
}

async function customerTaxIds(stripe: Stripe, customerId: string | null): Promise<TaxIdInput[]> {
  if (!customerId) return [];
  const listed = await stripe.customers.listTaxIds(customerId, { limit: 100 });
  return listed.data.map(toTaxInput);
}

async function rejectSubscription(
  stripe: Stripe,
  washerId: string,
  subscription: Stripe.Subscription,
  customerId: string | null,
  status: "country_mismatch" | "vat_missing",
  extra: Record<string, unknown>
) {
  const flag = status === "vat_missing" ? "vat_missing" : "country_mismatch";
  if (subscription.status !== "canceled") {
    await stripe.subscriptions.update(subscription.id, {
      metadata: { ...subscription.metadata, [flag]: "1", washer_id: washerId },
    });
    await stripe.subscriptions.cancel(subscription.id);
  }
  await updateWasherBilling(washerId, {
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    subscription_status: status,
    ...extra,
  });
  console.log(`Subscription ${status} washer=${washerId}`);
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
        await rejectSubscription(stripe, washerId, subscription, customerId, "country_mismatch", {
          billing_country_code: billingCountry,
        });
        break;
      }

      const sessionIds = (session.customer_details?.tax_ids || []).map((id) => toTaxInput(id));
      const merged = new Map<string, TaxIdInput>();
      for (const id of sessionIds) {
        if (!id.value) continue;
        merged.set(`${id.type}:${id.value}`, id);
      }
      for (const id of await customerTaxIds(stripe, customerId)) {
        if (!id.value) continue;
        merged.set(`${id.type}:${id.value}`, id);
      }
      const decision = assessBusinessTaxId({
        taxIds: [...merged.values()],
        registeredCountry: expected,
        billingCountry,
      });
      if (!decision.ok) {
        await rejectSubscription(stripe, washerId, subscription, customerId, decision.status, {
          billing_country_code: billingCountry,
        });
        break;
      }
      if (decision.verificationStatus === "unverified") {
        console.log(`VAT unverified washer=${washerId}`);
      }

      await saveSubscription(washerId, subscription, customerId);
      await updateWasherBilling(washerId, {
        billing_country_code: billingCountry,
        vat_number: decision.vatNumber,
        vat_verification: decision.verificationStatus,
      });
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
      if (subscription.metadata?.vat_missing === "1") {
        await updateWasherBilling(washerId, {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          subscription_status: "vat_missing",
        });
        break;
      }
      const current = await loadWasherBilling(washerId);
      if (
        current.ok &&
        (current.washer.subscription_status === "country_mismatch" ||
          current.washer.subscription_status === "vat_missing")
      ) {
        break;
      }

      const taxIds = await customerTaxIds(stripe, customerId);
      const decision = assessBusinessTaxId({
        taxIds,
        registeredCountry: subscription.metadata?.country_code,
        billingCountry: current.ok ? current.washer.billing_country_code : null,
      });
      if (!decision.ok) {
        if (decision.status === "vat_missing" && taxIds.length === 0) {
          // Checkout copies the tax ID onto the customer as the session completes.
          // This event can arrive first. Leave access closed; the session handler cancels if it stays missing.
          console.log(`Subscription ${subscription.id} has no tax ID yet`);
          break;
        }
        await rejectSubscription(stripe, washerId, subscription, customerId, decision.status, {});
        break;
      }
      if (decision.verificationStatus === "unverified") {
        console.log(`VAT unverified washer=${washerId}`);
      }
      await saveSubscription(washerId, subscription, customerId);
      await updateWasherBilling(washerId, {
        vat_number: decision.vatNumber,
        vat_verification: decision.verificationStatus,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = asId(subscription.customer);
      const washerId = await resolveWasherId(subscription.metadata, customerId);
      if (!washerId) break;
      const mismatch = subscription.metadata?.country_mismatch === "1";
      const vatMissing = subscription.metadata?.vat_missing === "1";
      let subscriptionStatus = mismatch ? "country_mismatch" : vatMissing ? "vat_missing" : "canceled";
      if (subscriptionStatus === "canceled") {
        const current = await loadWasherBilling(washerId);
        if (
          current.ok &&
          (current.washer.subscription_status === "country_mismatch" ||
            current.washer.subscription_status === "vat_missing")
        ) {
          subscriptionStatus = current.washer.subscription_status;
        }
      }
      await updateWasherBilling(washerId, {
        stripe_customer_id: customerId,
        stripe_subscription_id: subscription.id,
        subscription_status: subscriptionStatus,
        current_period_end: subscriptionPeriodEnd(subscription),
      });
      break;
    }

    case "customer.tax_id.updated": {
      const taxId = event.data.object as Stripe.TaxId;
      const customerId = asId(taxId.customer);
      const washerId = customerId ? await findWasherIdByCustomer(customerId) : null;
      if (!washerId) break;
      const verification = taxId.verification?.status || "unknown";
      if (verification === "unverified") {
        console.log(`VAT unverified washer=${washerId} type=${taxId.type}`);
      }
      await updateWasherBilling(washerId, {
        vat_number: taxId.value,
        vat_verification: verification,
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
