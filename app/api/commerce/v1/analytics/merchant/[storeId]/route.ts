import { NextResponse } from "next/server";
import { getMerchantCommerceAnalytics } from "@/modules/marketplace/statistics";

type Props = { params: Promise<{ storeId: string }> };

export async function GET(request: Request, { params }: Props) {
  const { storeId } = await params;
  const { searchParams } = new URL(request.url);
  const days = Math.min(Math.max(Number(searchParams.get("days") ?? "30"), 1), 365);

  try {
    const data = await getMerchantCommerceAnalytics(storeId, days);
    return NextResponse.json({ data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Analytics unavailable";
    const status = message === "Forbidden" ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
