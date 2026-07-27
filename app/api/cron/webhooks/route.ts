import { NextResponse } from "next/server";
import { processPendingWebhookDeliveries } from "@/modules/webhooks/repository";
import { verifyCronSecret, cronUnauthorizedResponse } from "@/lib/security/cron-auth";

export async function GET(request: Request) {
  const auth = verifyCronSecret(request);
  if (!auth.authorized) return cronUnauthorizedResponse();

  const result = await processPendingWebhookDeliveries(50);
  return NextResponse.json(result);
}
