import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadWasherBilling, updateWasherBilling } from "@/lib/billing";
import { isSoldCountry, monthlyPriceEur, yearlyPriceEur } from "@/lib/pricing";
import { subscriptionAllowsAccess } from "@/lib/subscription-rules";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const washerId = (session?.user as { id?: string } | undefined)?.id;
  if (!washerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const countryCode = String(body.countryCode || "").toUpperCase();
  if (!isSoldCountry(countryCode)) {
    return NextResponse.json({ error: "Country is not available" }, { status: 400 });
  }

  const loaded = await loadWasherBilling(washerId);
  if (!loaded.ok) {
    return NextResponse.json(
      { error: loaded.missingColumns ? "Subscription columns are missing" : "Washer not found" },
      { status: loaded.missingColumns ? 503 : 404 }
    );
  }
  if (subscriptionAllowsAccess(loaded.washer.subscription_status)) {
    return NextResponse.json({ error: "Country is fixed while the subscription is active" }, { status: 409 });
  }

  const updated = await updateWasherBilling(washerId, { country_code: countryCode });
  if (!updated.ok) {
    return NextResponse.json({ error: "Could not save country" }, { status: updated.missingColumns ? 503 : 500 });
  }

  return NextResponse.json({
    countryCode,
    monthlyEur: monthlyPriceEur(countryCode),
    yearlyEur: yearlyPriceEur(countryCode),
  });
}
