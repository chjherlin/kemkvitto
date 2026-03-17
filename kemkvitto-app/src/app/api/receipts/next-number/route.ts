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
    .select("next_receipt_number, brand_color, price_list, garment_list, service_list")
    .eq("id", washerId)
    .single();

  // Fallback if brand_color/price_list columns don't exist (migration 002)
  if (error?.code === "PGRST204" || error?.code === "42703") {
    const fallback = await supabase
      .from("washers")
      .select("next_receipt_number")
      .eq("id", washerId)
      .single();
    data = fallback.data as typeof data;
  }

  return NextResponse.json({
    nextReceiptNumber: data?.next_receipt_number ?? 1,
    brandColor: (data as Record<string, unknown>)?.brand_color ?? "#0891b2",
    priceList: (data as Record<string, unknown>)?.price_list ?? {},
    garmentList: ((data as Record<string, unknown>)?.garment_list as string[] | null) ?? DEFAULT_GARMENTS,
    serviceList: ((data as Record<string, unknown>)?.service_list as string[] | null) ?? DEFAULT_SERVICES,
  });
}
