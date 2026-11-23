import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { sendReadyTodayEmail, type WasherInfo } from "@/lib/email";
import { loadMailWasher } from "@/lib/mail-washer";
import { calendarDate } from "@/lib/reminder-list";

export async function GET(request: Request) {
  // Fail closed: a missing or wrong secret never sends mail.
  const secret = request.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Promised dates are calendar days. Laundries are in Sweden, and there is no
  // timezone column, so "today" is the Stockholm date rather than UTC.
  const today = calendarDate(new Date(), "Europe/Stockholm");

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
    return NextResponse.json({ message: "No reminders to send", count: 0, date: today });
  }

  const washerCache: Record<string, WasherInfo | undefined> = {};

  let sent = 0;
  for (const receipt of receipts) {
    if (!(receipt.washer_id in washerCache)) {
      washerCache[receipt.washer_id] = await loadMailWasher(supabase, receipt.washer_id);
    }

    try {
      await sendReadyTodayEmail(receipt, washerCache[receipt.washer_id]);
      await supabase.from("receipts").update({ reminder_sent: true }).eq("id", receipt.id);
      sent++;
    } catch (err) {
      console.error(`Failed ready-today email for receipt ${receipt.id}:`, err);
    }
  }

  return NextResponse.json({ message: `Sent ${sent} ready-today emails`, count: sent, date: today });
}
