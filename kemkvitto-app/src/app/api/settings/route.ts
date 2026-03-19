import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";

const DEFAULT_GARMENTS = [
  "Rock", "Kostym", "Kavaj", "Byxor", "Kappa", "Dräkt", "Jacka", "Kjol",
  "Poplin", "Matta", "Klänning", "Blus", "Skjorta",
  "Mocka", "Slips", "Jumper", "Gardin", "Vittvätt",
];
const DEFAULT_SERVICES = ["Pressning", "Stärkning", "Vikning", "Express"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const washerId = (session.user as { id: string }).id;
  const supabase = createServiceClient();

  let { data, error } = await supabase
    .from("washers")
    .select("brand_color, price_list, business_name, garment_list, service_list")
    .eq("id", washerId)
    .single();

  // If garment_list/service_list columns don't exist yet, fall back to base columns
  if (error?.code === "42703" || error?.code === "PGRST204") {
    const fallback = await supabase
      .from("washers")
      .select("brand_color, price_list, business_name")
      .eq("id", washerId)
      .single();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data = fallback.data as any;
    error = fallback.error;
  }

  if (error || !data) {
    return NextResponse.json(
      { error: "Kunde inte hamta installningar" },
      { status: 500 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = data as any;
  return NextResponse.json({
    brandColor: raw.brand_color,
    priceList: raw.price_list,
    businessName: raw.business_name,
    garmentList: ((raw.garment_list as string[] | null) ?? DEFAULT_GARMENTS).filter((g: string) => g !== "Skjorta ×5" && g !== "Skjorta ×10"),
    serviceList: (raw.service_list as string[] | null) ?? DEFAULT_SERVICES,
  });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const washerId = (session.user as { id: string }).id;
  const { brandColor, priceList, businessName, garmentList, serviceList } = await request.json();
  const supabase = createServiceClient();

  let { error } = await supabase
    .from("washers")
    .update({
      brand_color: brandColor,
      price_list: priceList,
      business_name: businessName,
      garment_list: garmentList ?? null,
      service_list: serviceList ?? null,
    })
    .eq("id", washerId);

  // If garment_list/service_list columns don't exist yet, retry with base columns only
  if (error?.code === "42703" || error?.code === "PGRST204") {
    const fallback = await supabase
      .from("washers")
      .update({
        brand_color: brandColor,
        price_list: priceList,
        business_name: businessName,
      })
      .eq("id", washerId);
    error = fallback.error;
  }

  if (error) {
    return NextResponse.json(
      { error: "Kunde inte uppdatera installningar" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
