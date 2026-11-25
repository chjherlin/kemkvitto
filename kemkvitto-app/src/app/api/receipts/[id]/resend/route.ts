import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { sendReceiptEmail } from "@/lib/email";
import { loadMailWasher } from "@/lib/mail-washer";
import { normalizeCustomerEmail } from "@/lib/customer-email";
import { receiptEmailRejection, shouldSaveCustomer } from "@/lib/email-address";
import { saveCustomerByEmail } from "@/app/api/customers/route";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const washerId = (session.user as { id: string }).id;
  const { id } = await params;
  const { email } = await request.json();
  const emailError = receiptEmailRejection(email);
  if (emailError) {
    return NextResponse.json({ error: emailError.error }, { status: emailError.status });
  }

  const supabase = createServiceClient();
  const normalized = normalizeCustomerEmail(email);
  const { data: existing } = await supabase
    .from("receipts")
    .select("washer_id")
    .eq("id", id)
    .eq("washer_id", washerId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: receipt, error } = await supabase
    .from("receipts")
    .update({ customer_email: normalized })
    .eq("id", id)
    .eq("washer_id", washerId)
    .select("*")
    .single();

  if (error || !receipt) {
    return NextResponse.json({ error: "Kvitto hittades inte" }, { status: 404 });
  }

  try {
    const washer = await loadMailWasher(supabase, washerId);
    await sendReceiptEmail({ ...receipt, customer_email: normalized }, washer);
  } catch (err) {
    console.error("Failed to resend receipt email:", err);
    return NextResponse.json({ error: "Mejlet kunde inte skickas" }, { status: 502 });
  }

  if (shouldSaveCustomer(true)) {
    await saveCustomerByEmail(supabase, washerId, normalized);
  }

  return NextResponse.json({ ok: true, email: normalized });
}
