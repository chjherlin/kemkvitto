import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const washerId = (session.user as { id: string }).id;
  const { nextReceiptNumber } = await request.json();

  if (!nextReceiptNumber || nextReceiptNumber < 1) {
    return NextResponse.json({ error: "Ogiltigt nummer" }, { status: 400 });
  }

  const supabase = createServiceClient();

  await supabase
    .from("washers")
    .update({ next_receipt_number: nextReceiptNumber })
    .eq("id", washerId);

  return NextResponse.json({ ok: true });
}
