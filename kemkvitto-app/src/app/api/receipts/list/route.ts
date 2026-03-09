import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const washerId = (session.user as { id: string }).id;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("receipts")
    .select(
      "id, receipt_number, garments, delivery_date, drop_off_date, customer_email, customer_name, customer_phone, comment, created_at"
    )
    .eq("washer_id", washerId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: "Kunde inte hamta kvitton" },
      { status: 500 }
    );
  }

  return NextResponse.json({ receipts: data });
}
