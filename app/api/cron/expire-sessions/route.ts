import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logging/logger";
import { securityLogger } from "@/lib/logging/security-logger";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    securityLogger.log({
      event: "unauthorized_access",
      path: "/api/cron/expire-sessions",
      metadata: { reason: "invalid_cron_secret" },
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("expire_stale_payment_sessions");

    if (error) {
      logger.error("Cron expire_stale_payment_sessions failed", { error: error.message });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    logger.info("Expired stale payment sessions", { count: data });

    return NextResponse.json({
      success: true,
      expired: data ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.error("Cron job failed", { error: String(err) });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
