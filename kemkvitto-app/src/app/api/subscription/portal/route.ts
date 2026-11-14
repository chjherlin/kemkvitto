import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { loadWasherBilling } from "@/lib/billing";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const washerId = (session?.user as { id?: string } | undefined)?.id;
  if (!washerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loaded = await loadWasherBilling(washerId);
  if (!loaded.ok || !loaded.washer.stripe_customer_id) {
    return NextResponse.json({ error: "No Stripe customer" }, { status: 400 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe subscription is not configured" }, { status: 503 });
  }

  const origin = process.env.NEXTAUTH_URL || new URL(request.url).origin;
  const portal = await getStripe().billingPortal.sessions.create({
    customer: loaded.washer.stripe_customer_id,
    return_url: `${origin}/subscribe`,
  });

  return NextResponse.json({ url: portal.url });
}
