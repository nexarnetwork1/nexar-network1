import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging/logger";
import { securityLogger } from "@/lib/logging/security-logger";
import { verifyCronSecret, cronUnauthorizedResponse } from "@/lib/security/cron-auth";

export async function GET(request: Request) {
  const auth = verifyCronSecret(request);
  if (!auth.authorized) {
    securityLogger.log({
      event: "unauthorized_access",
      path: "/api/cron/expire-sessions",
      metadata: { reason: "invalid_cron_secret" },
    });
    return cronUnauthorizedResponse();
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("expire_stale_payment_sessions");

    if (error) {
      logger.error("Cron expire_stale_payment_sessions failed", { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: expiredPromotions, error: promoError } = await admin.rpc(
      "expire_merchant_promotions"
    );

    if (promoError) {
      logger.warn("Cron expire_merchant_promotions failed", { error: promoError.message });
    }

    logger.info("Expired stale payment sessions", { count: data });

    return NextResponse.json({
      success: true,
      expired: data ?? 0,
      expiredPromotions: expiredPromotions ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error("Cron job failed", { error: String(err) });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
