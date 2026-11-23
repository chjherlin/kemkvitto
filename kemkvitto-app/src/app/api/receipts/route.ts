import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { sendReceiptEmail } from "@/lib/email";
import { loadMailWasher } from "@/lib/mail-washer";
import { buildReceiptInsert } from "@/lib/receipt-insert";
import { formatReceiptNumber, parseReceiptCounter } from "@/lib/receipt-number";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const washerId = (session.user as { id: string }).id;
  const {
    receiptNumber, nextReceiptNumber, oneTime, tagNumber, garments, deliveryDate, dropOffDate,
    comment, customerName, customerPhone, customerEmail, amountTotal, services,
  } = await request.json();

  if (!receiptNumber || !garments || !deliveryDate) {
    return NextResponse.json(
      { error: "Obligatoriska falt saknas" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const storedReceiptNumber = oneTime
    ? String(receiptNumber)
    : formatReceiptNumber(parseReceiptCounter(String(receiptNumber)));

  const insertData = buildReceiptInsert({
    washerId,
    receiptNumber: storedReceiptNumber,
    tagNumber,
    garments,
    deliveryDate,
    dropOffDate,
    comment,
    customerName,
    customerPhone,
    customerEmail,
    amountTotal,
    services,
  });

  const { data, error } = await supabase
    .from("receipts")
    .insert(insertData)
    .select("*")
    .single();

  if (error) {
    console.error("Receipt insert error:", error.code, error.message);
    return NextResponse.json(
      { error: `Kunde inte skapa kvitto: ${error.message}` },
      { status: 500 }
    );
  }

  // Update next_receipt_number — client sends the correct next value
  // (for special receipts the regular counter is preserved, not incremented past the special number)
  const storedNext = nextReceiptNumber ?? receiptNumber + 1;
  await supabase
    .from("washers")
    .update({ next_receipt_number: storedNext })
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
      const washer = await loadMailWasher(supabase, washerId);

      // Merge in fields that the DB may not have returned (optional columns)
      const receiptForEmail = {
        ...data!,
        customer_email: customerEmail,
        customer_name: customerName || null,
        customer_phone: customerPhone || null,
        drop_off_date: dropOffDate || null,
        services: services ?? [],
      };

      await sendReceiptEmail(receiptForEmail, washer);
      emailSent = true;
      console.log(`Email sent to ${customerEmail} for receipt #${receiptNumber}`);
    } catch (err) {
      console.error("Failed to send receipt email:", err);
    }
  }

  return NextResponse.json({ id: data!.id, emailSent, nextReceiptNumber: storedNext }, { status: 201 });
}
