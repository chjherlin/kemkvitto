import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import { sendReminderEmail } from "@/lib/email";
import { loadMailWasher } from "@/lib/mail-washer";
import { isPromisedDatePast, calendarDate } from "@/lib/reminder-list";
import { timezoneForCountry } from "@/lib/country-timezone";

function missingColumn(code: string | undefined): boolean {
  return code === "42703" || code === "PGRST204";
}

export async function POST(
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

  const { data: receipt, error } = await supabase
    .from("receipts")
    .select("*")
    .eq("id", id)
    .eq("washer_id", washerId)
    .single();

  if (error || !receipt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!receipt.customer_email) {
    return NextResponse.json({ error: "No customer email" }, { status: 400 });
  }

  const washer = await loadMailWasher(supabase, washerId);
  const today = calendarDate(new Date(), timezoneForCountry(washer?.country_code));
  if (!isPromisedDatePast(receipt.delivery_date, today)) {
    return NextResponse.json({ error: "Promised date has not passed" }, { status: 400 });
  }

  try {
    await sendReminderEmail(receipt, washer);
  } catch (err) {
    console.error("Reminder email failed:", err);
    return NextResponse.json({ error: "Could not send reminder" }, { status: 502 });
  }

  const reminderSentAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("receipts")
    .update({ reminder_sent_at: reminderSentAt })
    .eq("id", id)
    .eq("washer_id", washerId);

  if (updateError) {
    if (missingColumn(updateError.code)) {
      console.log("reminder_sent_at is missing; email was sent and the time was not stored");
    } else {
      console.error("Could not store reminder time:", updateError.code, updateError.message);
    }
    return NextResponse.json({ ok: true, persisted: false, reminderSentAt: null });
  }

  return NextResponse.json({ ok: true, persisted: true, reminderSentAt });
}
