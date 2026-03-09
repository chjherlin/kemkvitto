import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase";
import type Stripe from "stripe";

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

  const supabase = createServiceClient();

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const receiptId = pi.metadata.receipt_id;
      if (receiptId) {
        await supabase
          .from("receipts")
          .update({ payment_status: "paid" })
          .eq("id", receiptId);
        console.log(`Payment succeeded for receipt ${receiptId}`);
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const receiptId = pi.metadata.receipt_id;
      if (receiptId) {
        await supabase
          .from("receipts")
          .update({ payment_status: "failed" })
          .eq("id", receiptId);
        console.log(`Payment failed for receipt ${receiptId}`);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
