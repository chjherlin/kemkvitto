import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { sendReminderEmail } from "@/lib/email";

export async function GET(request: Request) {
  // Require secret to prevent unauthorized triggering
  const secret = request.headers.get("x-cron-secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Tomorrow's date in local-friendly ISO format
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().split("T")[0];

  const { data: receipts, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("delivery_date", tomorrowISO)
    .eq("reminder_sent", false)
    .eq("paid", false)
    .neq("customer_email", "");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!receipts || receipts.length === 0) {
    return NextResponse.json({ message: "No reminders to send", count: 0, date: tomorrowISO });
  }

  const washerCache: Record<string, { business_name: string; brand_color: string; price_list: Record<string, number> }> = {};

  let sent = 0;
  for (const receipt of receipts) {
    if (!washerCache[receipt.washer_id]) {
      const { data: washer } = await supabase
        .from("washers")
        .select("business_name, brand_color, price_list")
        .eq("id", receipt.washer_id)
        .single();
      if (washer) washerCache[receipt.washer_id] = washer;
    }

    try {
      await sendReminderEmail(receipt, washerCache[receipt.washer_id] ?? undefined);
      await supabase.from("receipts").update({ reminder_sent: true }).eq("id", receipt.id);
      sent++;
    } catch (err) {
      console.error(`Failed reminder for receipt ${receipt.id}:`, err);
    }
  }

  return NextResponse.json({ message: `Sent ${sent} reminders`, count: sent, date: tomorrowISO });
}
