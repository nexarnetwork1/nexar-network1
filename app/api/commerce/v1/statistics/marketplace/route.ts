import { NextResponse } from "next/server";
import { getMarketplaceStatistics } from "@/modules/marketplace/statistics";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "12"), 50);

  try {
    const data = await getMarketplaceStatistics(limit);
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Statistics unavailable" },
      { status: 500 }
    );
  }
}
