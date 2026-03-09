import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { sendReceiptEmail } from "@/lib/email";

// Columns added in migrations 003 and 004 that may not exist yet
const OPTIONAL_COLUMNS = ["customer_name", "customer_phone", "drop_off_date", "amount_total", "tag_number", "paid", "services"];

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const washerId = (session.user as { id: string }).id;
  const {
    receiptNumber, tagNumber, garments, deliveryDate, dropOffDate,
    comment, customerName, customerPhone, customerEmail, amountTotal,
    paid, services,
  } = await request.json();

  if (!receiptNumber || !garments || !deliveryDate) {
    return NextResponse.json(
      { error: "Obligatoriska falt saknas" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const insertData: Record<string, unknown> = {
    washer_id: washerId,
    receipt_number: receiptNumber,
    tag_number: tagNumber || null,
    garments,
    delivery_date: deliveryDate,
    customer_email: customerEmail || "",
    comment: comment || null,
    customer_name: customerName || null,
    customer_phone: customerPhone || null,
    drop_off_date: dropOffDate || null,
    amount_total: amountTotal || 0,
    paid: paid ?? false,
    services: services ?? [],
  };

  let { data, error } = await supabase
    .from("receipts")
    .insert(insertData)
    .select("*")
    .single();

  // If a column doesn't exist (PGRST204 / 42703), strip all optional columns and retry
  if (error?.code === "PGRST204" || error?.code === "42703") {
    console.log("Stripping optional columns and retrying insert");
    for (const col of OPTIONAL_COLUMNS) {
      delete insertData[col];
    }
    const fallback = await supabase
      .from("receipts")
      .insert(insertData)
      .select("*")
      .single();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    console.error("Receipt insert error:", error.code, error.message);
    return NextResponse.json(
      { error: `Kunde inte skapa kvitto: ${error.message}` },
      { status: 500 }
    );
  }

  // Update next_receipt_number to be one more than the used number
  await supabase
    .from("washers")
    .update({ next_receipt_number: receiptNumber + 1 })
    .eq("id", washerId);

  // Upsert customer record if name provided
  if (customerName) {
    await supabase
      .from("customers")
      .upsert(
        {
          washer_id: washerId,
          name: customerName,
          phone: customerPhone || "",
          email: customerEmail || "",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "washer_id,name" }
      )
      .then(({ error: custErr }) => {
        if (custErr) console.error("Customer upsert error:", custErr.code, custErr.message);
      });
  }

  // If customer email provided, send receipt email immediately
  let emailSent = false;
  if (customerEmail) {
    try {
      const { data: washer } = await supabase
        .from("washers")
        .select("business_name, brand_color, price_list")
        .eq("id", washerId)
        .single();

      // Ensure the receipt object has customer fields even if DB doesn't
      const receiptForEmail = {
        ...data!,
        customer_email: customerEmail,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        drop_off_date: dropOffDate || null,
        paid: paid ?? false,
        services: services ?? [],
      };

      await sendReceiptEmail(receiptForEmail, washer ?? undefined);
      emailSent = true;
      console.log(`Email sent to ${customerEmail} for receipt #${receiptNumber}`);
    } catch (err) {
      console.error("Failed to send receipt email:", err);
    }
  }

  return NextResponse.json({ id: data!.id, emailSent }, { status: 201 });
}
