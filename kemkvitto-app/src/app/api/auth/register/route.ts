import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServiceClient } from "@/lib/supabase";
import { isSoldCountry } from "@/lib/pricing";
import { normalizeLocale } from "@/lib/subscription-notices";
import { canonicalBrandHex } from "@/lib/brand";
import { DEFAULT_GARMENTS, DEFAULT_PRICE_LIST, DEFAULT_SERVICES } from "@/lib/laundry-defaults";

export async function POST(request: Request) {
  const { email, password, businessName, countryCode, locale, brandColor } = await request.json();

  if (!email || !password || !businessName || !countryCode) {
    return NextResponse.json(
      { error: "Alla falt kravs" },
      { status: 400 }
    );
  }

  if (String(password).length < 8) {
    return NextResponse.json({ error: "Lösenordet måste ha minst 8 tecken" }, { status: 400 });
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
  const withCountry = {
    ...baseRow,
    country_code: String(countryCode).toUpperCase(),
    locale: normalizeLocale(locale),
    brand_color: canonicalBrandHex(brandColor),
    garment_list: DEFAULT_GARMENTS,
    service_list: DEFAULT_SERVICES,
  };
  let { error } = await supabase.from("washers").insert(withCountry);
  if (error?.code === "42703" || error?.code === "PGRST204") {
    const withoutColour = { ...withCountry };
    delete (withoutColour as { brand_color?: string }).brand_color;
    const retry = await supabase.from("washers").insert(withoutColour);
    error = retry.error;
  }
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
