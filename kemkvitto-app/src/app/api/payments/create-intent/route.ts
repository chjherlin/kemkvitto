import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

export async function POST(request: Request) {
  const { receiptId } = await request.json();

  if (!receiptId) {
    return NextResponse.json({ error: "Receipt ID required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: receipt, error } = await supabase
    .from("receipts")
    .select("id, receipt_number, amount_total, payment_status, payment_intent_id, washer_id")
    .eq("id", receiptId)
    .single();

  if (error || !receipt) {
    return NextResponse.json({ error: "Receipt not found" }, { status: 404 });
  }

  if (receipt.payment_status === "paid") {
    return NextResponse.json({ error: "Already paid" }, { status: 400 });
  }

  // Demo mode — no real Stripe calls
  if (!isStripeConfigured) {
    return NextResponse.json({
      demo: true,
      clientSecret: null,
      paymentIntentId: null,
    });
  }

  // Live mode — use Stripe
  const { getStripe } = await import("@/lib/stripe");

  // Reuse existing payment intent if possible
  if (receipt.payment_intent_id && receipt.payment_status === "pending") {
    const existingIntent = await getStripe().paymentIntents.retrieve(receipt.payment_intent_id);
    if (existingIntent.status !== "canceled" && existingIntent.status !== "requires_payment_method") {
      return NextResponse.json({
        demo: false,
        clientSecret: existingIntent.client_secret,
        paymentIntentId: existingIntent.id,
      });
    }
  }

  const { data: washer } = await supabase
    .from("washers")
    .select("business_name")
    .eq("id", receipt.washer_id)
    .single();

  const paymentIntent = await getStripe().paymentIntents.create({
    amount: receipt.amount_total,
    currency: "sek",
    payment_method_types: ["card", "swish"],
    description: `Kvitto #${receipt.receipt_number} — ${washer?.business_name || "Kemtvätt"}`,
    metadata: {
      receipt_id: receipt.id,
      receipt_number: String(receipt.receipt_number),
    },
  });

  await supabase
    .from("receipts")
    .update({ payment_intent_id: paymentIntent.id })
    .eq("id", receiptId);

  return NextResponse.json({
    demo: false,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  });
}
