import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { sendDateUpdateEmail } from "@/lib/email";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const washerId = (session.user as { id: string }).id;
  const { id } = await params;
  const supabase = createServiceClient();

  // Fetch existing receipt to check ownership and detect date change
  const { data: existing } = await supabase
    .from("receipts")
    .select("washer_id, delivery_date, customer_email, paid, reminder_sent")
    .eq("id", id)
    .single();

  if (!existing || existing.washer_id !== washerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { garments, services, deliveryDate, customerName, customerEmail, comment, amountTotal } = body;

  const dateChanged = deliveryDate && deliveryDate !== existing.delivery_date;

  const { error } = await supabase
    .from("receipts")
    .update({
      garments,
      services: services ?? [],
      delivery_date: deliveryDate,
      customer_name: customerName || null,
      customer_email: customerEmail || "",
      comment: comment || null,
      amount_total: amountTotal ?? 0,
      // Reset reminder so day-before fires again on new date
      ...(dateChanged ? { reminder_sent: false } : {}),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Send date-change notification if date shifted and customer has email and isn't paid
  if (dateChanged && customerEmail && !existing.paid) {
    try {
      const { data: washer } = await supabase
        .from("washers")
        .select("business_name, brand_color, price_list")
        .eq("id", washerId)
        .single();

      const updatedReceipt = {
        id,
        receipt_number: 0, // will be fetched below
        garments,
        delivery_date: deliveryDate,
        customer_email: customerEmail,
        customer_name: customerName || null,
        comment: comment || null,
        amount_total: amountTotal ?? 0,
        paid: false,
        services: services ?? [],
      };

      // Get receipt_number for email subject
      const { data: full } = await supabase
        .from("receipts")
        .select("receipt_number")
        .eq("id", id)
        .single();

      updatedReceipt.receipt_number = full?.receipt_number ?? 0;

      await sendDateUpdateEmail(
        updatedReceipt,
        existing.delivery_date,
        deliveryDate,
        washer ?? undefined
      );
    } catch (err) {
      console.error("Failed to send date update email:", err);
      // Don't fail the request over an email error
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const washerId = (session.user as { id: string }).id;
  const { id } = await params;
  const supabase = createServiceClient();

  // Verify ownership before deleting
  const { data: existing } = await supabase
    .from("receipts")
    .select("washer_id")
    .eq("id", id)
    .single();

  if (!existing || existing.washer_id !== washerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("receipts")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
