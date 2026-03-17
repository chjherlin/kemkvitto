import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";

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

  // Verify ownership
  const { data: existing } = await supabase
    .from("receipts")
    .select("washer_id")
    .eq("id", id)
    .single();

  if (!existing || existing.washer_id !== washerId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const { garments, services, deliveryDate, customerName, customerEmail, comment, amountTotal } = body;

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
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
