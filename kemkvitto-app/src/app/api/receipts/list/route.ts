import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";

// Full select — includes optional `services` column (migration not applied on all envs)
const FULL_SELECT =
  "id, receipt_number, tag_number, garments, delivery_date, drop_off_date, customer_email, customer_name, customer_phone, comment, created_at, amount_total, services";

// Same columns plus the manual reminder time (migration 008, not applied everywhere)
const WITH_REMINDER = `${FULL_SELECT}, reminder_sent_at`;

// Base select with only migration 001 columns
const BASE_SELECT =
  "id, receipt_number, garments, delivery_date, customer_email, comment, created_at";

function missingColumn(code: string | undefined): boolean {
  return code === "42703" || code === "PGRST204";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const washerId = (session.user as { id: string }).id;
  const supabase = createServiceClient();

  let { data, error } = await supabase
    .from("receipts")
    .select(WITH_REMINDER)
    .eq("washer_id", washerId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (missingColumn(error?.code)) {
    const again = await supabase
      .from("receipts")
      .select(FULL_SELECT)
      .eq("washer_id", washerId)
      .order("created_at", { ascending: false })
      .limit(100);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data = again.data as any;
    error = again.error;
  }

  if (missingColumn(error?.code)) {
    const fallback = await supabase
      .from("receipts")
      .select(BASE_SELECT)
      .eq("washer_id", washerId)
      .order("created_at", { ascending: false })
      .limit(100);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data = fallback.data as any;
    error = fallback.error;
  }

  if (error) {
    console.error("Receipt list error:", error.code, error.message);
    return NextResponse.json(
      { error: "Kunde inte hamta kvitton" },
      { status: 500 }
    );
  }

  return NextResponse.json({ receipts: data });
}
