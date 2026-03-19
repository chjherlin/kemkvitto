import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { sendReceiptEmail, sendDateUpdateEmail } from "@/lib/email";

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

  // Fetch existing receipt to check ownership and detect changes.
  // Only select columns guaranteed to exist (migration 001 + 004).
  // Avoid selecting `paid` — it's not in any migration; use payment_status instead.
  const { data: existing } = await supabase
    .from("receipts")
    .select("washer_id, delivery_date, customer_email, payment_status, reminder_sent")
    .eq("id", id)
    .single();

  if (!existing || existing.washer_id !== washerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { garments, services, deliveryDate, customerName, customerEmail, comment, amountTotal } = body;

  const dateChanged = deliveryDate && deliveryDate !== existing.delivery_date;
  const isPaid = existing.payment_status === "paid";

  // Try full update (including services); fall back without services if column missing
  let updateError = (await supabase
    .from("receipts")
    .update({
      garments,
      services: services ?? [],
      delivery_date: deliveryDate,
      customer_name: customerName || null,
      customer_email: customerEmail || "",
      comment: comment || null,
      amount_total: amountTotal ?? 0,
      ...(dateChanged ? { reminder_sent: false } : {}),
    })
    .eq("id", id)).error;

  if (updateError?.code === "42703" || updateError?.code === "PGRST204") {
    updateError = (await supabase
      .from("receipts")
      .update({
        garments,
        delivery_date: deliveryDate,
        customer_name: customerName || null,
        customer_email: customerEmail || "",
        comment: comment || null,
        amount_total: amountTotal ?? 0,
        ...(dateChanged ? { reminder_sent: false } : {}),
      })
      .eq("id", id)).error;
  }

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Send update email to customer if they have an email and receipt isn't paid
  if (customerEmail && !isPaid) {
    try {
      const { data: washer } = await supabase
        .from("washers")
        .select("business_name, brand_color, price_list")
        .eq("id", washerId)
        .single();

      // Get receipt_number for email subject
      const { data: full } = await supabase
        .from("receipts")
        .select("receipt_number")
        .eq("id", id)
        .single();

      const updatedReceipt = {
        id,
        receipt_number: full?.receipt_number ?? 0,
        garments,
        delivery_date: deliveryDate,
        customer_email: customerEmail,
        customer_name: customerName || null,
        comment: comment || null,
        amount_total: amountTotal ?? 0,
        paid: false,
        services: services ?? [],
      };

      if (dateChanged) {
        await sendDateUpdateEmail(
          updatedReceipt,
          existing.delivery_date,
          deliveryDate,
          washer ?? undefined
        );
      } else {
        await sendReceiptEmail(updatedReceipt, washer ?? undefined);
      }
    } catch (err) {
      console.error("Failed to send update email:", err);
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
