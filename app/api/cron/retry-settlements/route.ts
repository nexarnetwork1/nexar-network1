import { NextResponse } from "next/server";
import { retryFailedSettlements } from "@/modules/settlement/worker";
import { verifyCronSecret, cronUnauthorizedResponse } from "@/lib/security/cron-auth";

export async function GET(request: Request) {
  const auth = verifyCronSecret(request);
  if (!auth.authorized) {
    return cronUnauthorizedResponse();
  }

  const result = await retryFailedSettlements(20);
  return NextResponse.json(result);
}
