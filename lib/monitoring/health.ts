import { createAdminClient } from "@/lib/supabase/admin";
import { isUpstashConfigured } from "@/lib/cache/upstash";
import { isPostHogConfigured } from "@/lib/monitoring/posthog";
import { isBetterStackConfigured } from "@/lib/monitoring/betterstack";

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
    email: "warn",
    stripe: "warn",
    monitoring: "warn",
    cache: "warn",
    analytics: "warn",
    uptime: "warn",
  };

  try {
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      const admin = createAdminClient();
      const { error } = await admin.from("platform_settings").select("id").limit(1);
      checks.supabase = error ? "error" : "ok";

      if (!error) {
        const [{ error: walletError }, { error: settingsError }] = await Promise.all([
          admin.from("wallets").select("id").limit(1),
          admin.from("store_settings").select("id").limit(1),
        ]);
        if (walletError || settingsError) checks.supabase = "warn";
      }
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

  checks.monitoring =
    process.env.SENTRY_DSN && process.env.NEXT_PUBLIC_SENTRY_DSN ? "ok" : "warn";

  checks.cache = isUpstashConfigured()
    ? "ok"
    : process.env.NODE_ENV === "production"
      ? "warn"
      : "warn";

  checks.analytics =
    isPostHogConfigured() || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
      ? "ok"
      : "warn";

  if (isBetterStackConfigured()) {
    checks.uptime = "ok";
  }

  const hasResend = Boolean(process.env.RESEND_API_KEY);
  const hasEmailFrom = Boolean(process.env.EMAIL_FROM);
  if (hasResend && hasEmailFrom) {
    checks.email = "ok";
  } else if (hasResend || hasEmailFrom) {
    checks.email = "warn";
  } else {
    checks.email = process.env.NODE_ENV === "production" ? "error" : "warn";
  }

  const hasStripeSecret = Boolean(process.env.STRIPE_SECRET_KEY);
  const hasStripeWebhook = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  if (hasStripeSecret && hasStripeWebhook) {
    checks.stripe = "ok";
  } else if (hasStripeSecret || hasStripeWebhook) {
    checks.stripe = "warn";
  } else {
    checks.stripe = process.env.NODE_ENV === "production" ? "warn" : "warn";
  }

  const hasError = Object.values(checks).some((v) => v === "error");
  const hasWarn = Object.values(checks).some((v) => v === "warn");

  return {
    status: hasError ? "unhealthy" : hasWarn ? "degraded" : "healthy",
    checks,
    timestamp: new Date().toISOString(),
  };
}
