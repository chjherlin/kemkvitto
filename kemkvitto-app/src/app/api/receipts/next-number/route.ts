import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { DEFAULT_BRAND } from "@/lib/brand";
import { DEFAULT_SERVICES, visibleGarments } from "@/lib/laundry-defaults";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const washerId = (session.user as { id: string }).id;
  const supabase = createServiceClient();

  let { data, error } = await supabase
    .from("washers")
    .select("next_receipt_number, brand_color, price_list, garment_list, service_list, business_name, country_code")
    .eq("id", washerId)
    .single();

  // Fallback if brand_color/price_list columns don't exist (migration 002)
  if (error?.code === "PGRST204" || error?.code === "42703") {
    const fallback = await supabase
      .from("washers")
      .select("next_receipt_number, business_name")
      .eq("id", washerId)
      .single();
    data = fallback.data as typeof data;
  }

  const d = data as Record<string, unknown>;
  return NextResponse.json({
    nextReceiptNumber: d?.next_receipt_number ?? 1,
    brandColor: d?.brand_color ?? DEFAULT_BRAND,
    priceList: d?.price_list ?? {},
    businessName: d?.business_name ?? "",
    countryCode: (d?.country_code as string | null) ?? null,
    garmentList: visibleGarments(d?.garment_list as string[] | null),
    serviceList: (d?.service_list as string[] | null) ?? DEFAULT_SERVICES,
  });
}
