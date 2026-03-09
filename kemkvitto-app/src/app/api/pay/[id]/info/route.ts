import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: receipt, error } = await supabase
    .from("receipts")
    .select("id, receipt_number, garments, amount_total, payment_status, washer_id")
    .eq("id", id)
    .single();

  if (error || !receipt) {
    return NextResponse.json({ receipt: null }, { status: 404 });
  }

  // Get washer info for branding
  const { data: washer } = await supabase
    .from("washers")
    .select("business_name, brand_color")
    .eq("id", receipt.washer_id)
    .single();

  return NextResponse.json({
    receipt: {
      receiptNumber: receipt.receipt_number,
      businessName: washer?.business_name || "",
      brandColor: washer?.brand_color || "#0891b2",
      amountTotal: receipt.amount_total,
      paymentStatus: receipt.payment_status,
      garments: receipt.garments,
    },
  });
}
