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
    .from("washers")
    .select("brand_color, price_list, business_name")
    .eq("id", washerId)
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Kunde inte hamta installningar" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    brandColor: data.brand_color,
    priceList: data.price_list,
    businessName: data.business_name,
  });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const washerId = (session.user as { id: string }).id;
  const { brandColor, priceList, businessName } = await request.json();
  const supabase = createServiceClient();

  const { error } = await supabase
    .from("washers")
    .update({
      brand_color: brandColor,
      price_list: priceList,
      business_name: businessName,
    })
    .eq("id", washerId);

  if (error) {
    return NextResponse.json(
      { error: "Kunde inte uppdatera installningar" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
