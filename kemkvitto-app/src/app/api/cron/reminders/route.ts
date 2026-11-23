import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { sendReadyTodayEmail } from "@/lib/email";
import { loadMailWasher } from "@/lib/mail-washer";
import {
  cronRequestAuthorized,
  reminderCandidateDates,
  reminderSchedule,
  shouldSendReadyReminder,
} from "@/lib/country-timezone";

/**
 * Morning reminder. Vercel calls this once a day at 05:00 UTC and sends
 * `Authorization: Bearer <CRON_SECRET>`. The older `x-cron-secret` header
 * is still accepted. Nothing is sent when CRON_SECRET is unset.
 *
 * The daily call includes every laundry whose promised date is that
 * laundry's own local today. A later hourly call uses `?mode=hourly` and
 * then only sends while local time is 06:00 up to, but not including, 09:00.
 *
 * Manual check, with a placeholder rather than a real secret:
 * curl -H "Authorization: Bearer replace-with-a-long-random-string" \
 *   http://localhost:3000/api/cron/reminders
 */
export async function GET(request: Request) {
  const authorized = cronRequestAuthorized({
    configuredSecret: process.env.CRON_SECRET,
    authorization: request.headers.get("authorization"),
    legacyHeader: request.headers.get("x-cron-secret"),
  });
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const schedule = reminderSchedule(request.url);
  const supabase = createServiceClient();
  const { data: receipts, error } = await supabase
    .from("receipts")
    .select("*")
    .in("delivery_date", reminderCandidateDates(now))
    .eq("reminder_sent", false)
    .neq("customer_email", "");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!receipts || receipts.length === 0) {
    return NextResponse.json({ message: "No reminders to send", count: 0, schedule });
  }

  const washerCache: Record<string, Awaited<ReturnType<typeof loadMailWasher>>> = {};
  let sent = 0;
  for (const receipt of receipts) {
    if (!(receipt.washer_id in washerCache)) {
      washerCache[receipt.washer_id] = await loadMailWasher(supabase, receipt.washer_id);
    }
    const washer = washerCache[receipt.washer_id];
    if (!shouldSendReadyReminder({
      deliveryDate: receipt.delivery_date,
      countryCode: washer?.country_code,
      now,
      schedule,
    })) {
      continue;
    }

    try {
      await sendReadyTodayEmail(receipt, washer);
      await supabase.from("receipts").update({ reminder_sent: true }).eq("id", receipt.id);
      sent++;
    } catch (err) {
      console.error(`Failed ready-today email for receipt ${receipt.id}:`, err);
    }
  }

  return NextResponse.json({ message: `Sent ${sent} ready-today emails`, count: sent, schedule });
}
