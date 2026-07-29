import { NextResponse } from "next/server";
import { getGlobalCommerceStatistics } from "@/modules/marketplace/statistics";

export async function GET() {
  try {
    const data = await getGlobalCommerceStatistics();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Statistics unavailable" },
      { status: 500 }
    );
  }
}
