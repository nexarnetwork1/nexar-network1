import { NextResponse } from "next/server";
import { listApprovedBrands } from "@/modules/marketplace/brands";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100);

  const data = await listApprovedBrands(limit);
  return NextResponse.json({ data });
}
