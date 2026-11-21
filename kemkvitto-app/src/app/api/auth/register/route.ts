import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServiceClient } from "@/lib/supabase";
import { isSoldCountry } from "@/lib/pricing";
import { normalizeLocale } from "@/lib/subscription-notices";
import { DEFAULT_GARMENTS, DEFAULT_PRICE_LIST, DEFAULT_SERVICES } from "@/lib/laundry-defaults";

export async function POST(request: Request) {
  const { email, password, businessName, countryCode, locale } = await request.json();

  if (!email || !password || !businessName || !countryCode) {
    return NextResponse.json(
      { error: "Alla falt kravs" },
      { status: 400 }
    );
  }

  if (!isSoldCountry(String(countryCode))) {
    return NextResponse.json(
      { error: "Landet säljs inte ännu" },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const supabase = createServiceClient();

  const baseRow = {
    email,
    password_hash: passwordHash,
    business_name: businessName,
    price_list: DEFAULT_PRICE_LIST,
  };
  let { error } = await supabase.from("washers").insert({
    ...baseRow,
    country_code: String(countryCode).toUpperCase(),
    locale: normalizeLocale(locale),
    garment_list: DEFAULT_GARMENTS,
    service_list: DEFAULT_SERVICES,
  });
  if (error?.code === "42703" || error?.code === "PGRST204") {
    const retry = await supabase.from("washers").insert(baseRow);
    error = retry.error;
  }

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "E-postadressen ar redan registrerad" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Registrering misslyckades" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
