import { NextResponse } from "next/server";
import { getLiveCommerceMetrics } from "@/modules/marketplace/statistics";

export async function GET() {
  try {
    const data = await getLiveCommerceMetrics();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Live metrics unavailable" },
      { status: 500 }
    );
  }
}
