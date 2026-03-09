import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const washerId = (session.user as { id: string }).id;
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("washers")
    .select("next_receipt_number, brand_color, price_list")
    .eq("id", washerId)
    .single();

  return NextResponse.json({
    nextReceiptNumber: data?.next_receipt_number ?? 1,
    brandColor: data?.brand_color ?? null,
    priceList: data?.price_list ?? null,
  });
}
