import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { sendReminderEmail } from "@/lib/email";

export async function GET() {
  const supabase = createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: receipts, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("delivery_date", today)
    .eq("reminder_sent", false)
    .neq("customer_email", "");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!receipts || receipts.length === 0) {
    return NextResponse.json({ message: "No reminders to send", count: 0 });
  }

  // Cache washer info to avoid repeated lookups
  const washerCache: Record<string, { business_name: string; brand_color: string; price_list: Record<string, number> }> = {};

  for (const receipt of receipts) {
    if (!washerCache[receipt.washer_id]) {
      const { data: washer } = await supabase
        .from("washers")
        .select("business_name, brand_color, price_list")
        .eq("id", receipt.washer_id)
        .single();
      if (washer) washerCache[receipt.washer_id] = washer;
    }

    await sendReminderEmail(receipt, washerCache[receipt.washer_id] ?? undefined);

    await supabase
      .from("receipts")
      .update({ reminder_sent: true })
      .eq("id", receipt.id);
  }

  return NextResponse.json({
    message: `Sent ${receipts.length} reminders`,
    count: receipts.length,
  });
}
