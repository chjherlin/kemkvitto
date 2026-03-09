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

  for (const receipt of receipts) {
    await sendReminderEmail(receipt);

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
