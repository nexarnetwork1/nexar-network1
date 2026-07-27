import { createAdminClient } from "@/lib/supabase/admin";

export type HealthCheck = {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<string, "ok" | "warn" | "error">;
  timestamp: string;
};

export async function runHealthChecks(): Promise<HealthCheck> {
  const checks: Record<string, "ok" | "warn" | "error"> = {
    app: "ok",
    supabase: "error",
    payments: "warn",
    monitoring: "warn",
  };

  try {
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      const admin = createAdminClient();
      const { error } = await admin.from("platform_settings").select("id").limit(1);
      checks.supabase = error ? "error" : "ok";
    } else if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      checks.supabase = "warn";
    }
  } catch {
    checks.supabase = "error";
  }

  const hasPaymentSeed = Boolean(process.env.PAYMENT_MASTER_SEED);
  const hasTreasury =
    Boolean(process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS) ||
    Boolean(process.env.TREASURY_WALLET_ADDRESS);
  const hasBscRpc =
    Boolean(process.env.BSC_RPC_URL) ||
    Boolean(process.env.NEXT_PUBLIC_BSC_RPC_URL);

  if (hasPaymentSeed && hasTreasury && hasBscRpc) {
    checks.payments = "ok";
  } else if (hasPaymentSeed || hasTreasury) {
    checks.payments = "warn";
  } else {
    checks.payments = process.env.NODE_ENV === "production" ? "error" : "warn";
  }

  checks.monitoring = process.env.SENTRY_DSN ? "ok" : "warn";

  const hasError = Object.values(checks).some((v) => v === "error");
  const hasWarn = Object.values(checks).some((v) => v === "warn");

  return {
    status: hasError ? "unhealthy" : hasWarn ? "degraded" : "healthy",
    checks,
    timestamp: new Date().toISOString(),
  };
}
