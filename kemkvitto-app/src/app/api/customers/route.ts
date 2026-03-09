import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";

// Search customers
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

  const { data, error } = await supabase
    .from("customers")
    .select("id, name, phone, email")
    .eq("washer_id", washerId)
    .or(`name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
    .order("updated_at", { ascending: false })
    .limit(5);

  if (error) {
    // Table might not exist yet — fall back to receipt-based search
    console.error("Customer search error:", error.code, error.message);
    return NextResponse.json({ customers: [] });
  }

  return NextResponse.json({ customers: data || [] });
}

// Upsert customer (create or update)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const washerId = (session.user as { id: string }).id;
  const { name, phone, email } = await request.json();

  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Upsert by washer_id + name
  const { data, error } = await supabase
    .from("customers")
    .upsert(
      {
        washer_id: washerId,
        name,
        phone: phone || "",
        email: email || "",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "washer_id,name" }
    )
    .select("id")
    .single();

  if (error) {
    console.error("Customer upsert error:", error.code, error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 200 });
}
