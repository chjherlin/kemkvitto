import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadWasherBilling } from "@/lib/billing";
import { countries, monthlyPriceEur, yearlyPriceEur } from "@/lib/pricing";
import { subscriptionAllowsAccess } from "@/lib/subscription-rules";

export async function GET() {
  const session = await getServerSession(authOptions);
  const washerId = (session?.user as { id?: string } | undefined)?.id;
  if (!washerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loaded = await loadWasherBilling(washerId);
  if (!loaded.ok) {
    return NextResponse.json({
      missingColumns: loaded.missingColumns,
      allowsAccess: false,
      countries: countries.map((c) => ({ code: c.code, name: c.name })),
    });
  }

  const washer = loaded.washer;
  const country = washer.country_code;
  return NextResponse.json({
    missingColumns: false,
    allowsAccess: subscriptionAllowsAccess(washer.subscription_status),
    status: washer.subscription_status,
    countryCode: country,
    billingCountryCode: washer.billing_country_code,
    interval: washer.subscription_interval,
    currentPeriodEnd: washer.current_period_end,
    priceAmountCents: washer.price_amount_cents,
    pendingPriceAmountCents: washer.pending_price_amount_cents,
    pendingPriceEffectiveAt: washer.pending_price_effective_at,
    hasCustomer: Boolean(washer.stripe_customer_id),
    monthlyEur: country ? monthlyPriceEur(country) : null,
    yearlyEur: country ? yearlyPriceEur(country) : null,
    countries: countries.map((c) => ({ code: c.code, name: c.name })),
  });
}
