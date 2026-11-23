import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { sendReceiptEmail } from "@/lib/email";
import { loadMailWasher } from "@/lib/mail-washer";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: "E-post kravs" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Update customer email
  const { data: receipt, error } = await supabase
    .from("receipts")
    .update({ customer_email: email })
    .eq("id", id)
    .select("*")
    .single();

  if (error || !receipt) {
    return NextResponse.json(
      { error: "Kvitto hittades inte" },
      { status: 404 }
    );
  }

  // Fetch washer info for branding and pricing
  const washer = await loadMailWasher(supabase, receipt.washer_id);

  await sendReceiptEmail(receipt, washer);

  return NextResponse.json({ ok: true });
}
