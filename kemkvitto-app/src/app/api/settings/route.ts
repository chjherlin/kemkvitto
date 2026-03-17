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

  const { data, error } = await supabase
    .from("washers")
    .select("brand_color, price_list, business_name, garment_list, service_list")
    .eq("id", washerId)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Kunde inte hamta installningar" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    brandColor: data.brand_color,
    priceList: data.price_list,
    businessName: data.business_name,
    garmentList: ((data.garment_list as string[] | null) ?? DEFAULT_GARMENTS).filter((g: string) => g !== "Skjorta ×5" && g !== "Skjorta ×10"),
    serviceList: (data.service_list as string[] | null) ?? DEFAULT_SERVICES,
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

  const { error } = await supabase
    .from("washers")
    .update({
      brand_color: brandColor,
      price_list: priceList,
      business_name: businessName,
      garment_list: garmentList ?? null,
      service_list: serviceList ?? null,
    })
    .eq("id", washerId);

  if (error) {
    return NextResponse.json(
      { error: "Kunde inte uppdatera installningar" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
