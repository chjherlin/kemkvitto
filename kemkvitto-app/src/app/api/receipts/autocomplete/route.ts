import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ customers: [] });
  }

  const washerId = (session.user as { id: string }).id;
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.length < 2) {
    return NextResponse.json({ customers: [] });
  }

  const supabase = createServiceClient();

  // Try with customer_name/phone columns (migration 003)
  let { data, error } = await supabase
    .from("receipts")
    .select("customer_name, customer_phone, customer_email")
    .eq("washer_id", washerId)
    .or(
      `customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%,customer_email.ilike.%${q}%`
    )
    .limit(50);

  // Fallback to just customer_email if columns don't exist
  if (error?.code === "PGRST204" || error?.code === "42703") {
    const fallback = await supabase
      .from("receipts")
      .select("customer_email")
      .eq("washer_id", washerId)
      .ilike("customer_email", `%${q}%`)
      .limit(50);

    if (fallback.error || !fallback.data) {
      return NextResponse.json({ customers: [] });
    }

    const seen = new Set<string>();
    const customers: { name: string; phone: string; email: string }[] = [];
    for (const r of fallback.data) {
      if (!r.customer_email || seen.has(r.customer_email)) continue;
      seen.add(r.customer_email);
      customers.push({ name: "", phone: "", email: r.customer_email });
      if (customers.length >= 5) break;
    }
    return NextResponse.json({ customers });
  }

  if (error || !data) {
    return NextResponse.json({ customers: [] });
  }

  // Deduplicate by name+phone combo
  const seen = new Set<string>();
  const customers: { name: string; phone: string; email: string }[] = [];

  for (const r of data) {
    const key = `${r.customer_name || ""}|${r.customer_phone || ""}`;
    if (seen.has(key)) continue;
    if (!r.customer_name && !r.customer_phone && !r.customer_email) continue;
    seen.add(key);
    customers.push({
      name: r.customer_name || "",
      phone: r.customer_phone || "",
      email: r.customer_email || "",
    });
    if (customers.length >= 5) break;
  }

  return NextResponse.json({ customers });
}
