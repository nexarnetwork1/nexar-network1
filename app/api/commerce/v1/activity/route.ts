import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "30"), 100);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("commerce_activity_events")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ data: [] });
  }

  return NextResponse.json({ data: data ?? [] });
}
