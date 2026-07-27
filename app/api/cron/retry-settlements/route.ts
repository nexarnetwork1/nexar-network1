import { NextResponse } from "next/server";
import { retryFailedSettlements } from "@/modules/settlement/worker";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await retryFailedSettlements(20);
  return NextResponse.json(result);
}
