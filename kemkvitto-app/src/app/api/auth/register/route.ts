import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServiceClient } from "@/lib/supabase";
import { isSoldCountry } from "@/lib/pricing";
import { normalizeLocale } from "@/lib/subscription-notices";

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

  const defaultPrices = {
    "Rock": 250,
    "Kostym": 350,
    "Kavaj": 200,
    "Byxor": 150,
    "Kappa": 350,
    "Dräkt": 300,
    "Jacka": 250,
    "Kjol": 150,
    "Poplin": 100,
    "Matta": 400,
    "Klänning": 250,
    "Blus": 130,
    "Skjorta": 80,
    "Mocka": 500,
    "Slips": 80,
    "Jumper": 130,
    "Gardin": 200,
    "Vittvätt": 100,
    "Pressning": 50,
    "Stärkning": 30,
    "Vikning": 20,
    "Express": 100,
  };

  const baseRow = {
    email,
    password_hash: passwordHash,
    business_name: businessName,
    price_list: defaultPrices,
  };
  let { error } = await supabase.from("washers").insert({
    ...baseRow,
    country_code: String(countryCode).toUpperCase(),
    locale: normalizeLocale(locale),
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
