import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const washerId = (session.user as { id: string }).id;
  const {
    receiptNumber, garments, deliveryDate, dropOffDate,
    comment, customerName, customerPhone,
  } = await request.json();

  if (!receiptNumber || !garments || !deliveryDate) {
    return NextResponse.json(
      { error: "Obligatoriska falt saknas" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Insert receipt (customer_email will be set later)
  const { data, error } = await supabase
    .from("receipts")
    .insert({
      washer_id: washerId,
      receipt_number: receiptNumber,
      garments,
      delivery_date: deliveryDate,
      customer_email: "",
      comment: comment || null,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      drop_off_date: dropOffDate || null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Kunde inte skapa kvitto" },
      { status: 500 }
    );
  }

  // Update next_receipt_number to be one more than the used number
  await supabase
    .from("washers")
    .update({ next_receipt_number: receiptNumber + 1 })
    .eq("id", washerId);

  return NextResponse.json({ id: data.id }, { status: 201 });
}
