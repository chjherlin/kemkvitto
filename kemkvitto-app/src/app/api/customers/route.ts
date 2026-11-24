import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase";
import {
  customerSearchQuery,
  matchingCustomerEmails,
  normalizeCustomerEmail,
} from "@/lib/customer-email";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const washerId = (session.user as { id: string }).id;
  const query = customerSearchQuery(new URL(request.url).searchParams.get("q"));
  if (!query) return NextResponse.json({ customers: [] });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("customers")
    .select("email, updated_at")
    .eq("washer_id", washerId)
    .ilike("email", `${query.replace(/[%_]/g, "")}%`)
    .order("updated_at", { ascending: false })
    .limit(30);

  if (error) {
    console.error("Customer search error:", error.code, error.message);
    return NextResponse.json({ error: "Kunde inte söka kunder" }, { status: 500 });
  }

  const emails = matchingCustomerEmails(
    (data || []).map((row) => ({ email: row.email, updatedAt: row.updated_at })),
    query
  );
  return NextResponse.json({ customers: emails.map((email) => ({ email })) });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const washerId = (session.user as { id: string }).id;
  const { email } = await request.json();
  const normalized = normalizeCustomerEmail(email);
  if (!normalized) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const id = await saveCustomerByEmail(supabase, washerId, normalized);
  if (!id) return NextResponse.json({ error: "Kunde inte spara kunden" }, { status: 500 });
  return NextResponse.json({ id }, { status: 200 });
}

export async function saveCustomerByEmail(
  supabase: ReturnType<typeof createServiceClient>,
  washerId: string,
  email: string
): Promise<string | null> {
  const normalized = normalizeCustomerEmail(email);
  if (!normalized) return null;
  const now = new Date().toISOString();
  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("washer_id", washerId)
    .ilike("email", normalized)
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("customers")
      .update({ email: normalized, updated_at: now })
      .eq("id", existing.id)
      .eq("washer_id", washerId);
    if (error) {
      console.error("Customer update error:", error.code, error.message);
      return null;
    }
    return existing.id;
  }

  const { data, error } = await supabase
    .from("customers")
    .insert({ washer_id: washerId, email: normalized, name: null, phone: null, updated_at: now })
    .select("id")
    .single();
  if (error) {
    console.error("Customer insert error:", error.code, error.message);
    return null;
  }
  return data.id;
}
