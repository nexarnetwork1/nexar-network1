import { createAdminClient } from "@/lib/supabase/admin";
import { runHealthChecks, type HealthCheck } from "./health";

export type SystemHealthSnapshot = HealthCheck & {
  checks: HealthCheck["checks"] & {
    realtime: "ok" | "warn" | "error";
    blockchain: "ok" | "warn" | "error";
    treasury: "ok" | "warn" | "error";
    background_jobs: "ok" | "warn" | "error";
    queue: "ok" | "warn" | "error";
  };
  metrics: {
    pending_webhooks: number;
    pending_withdrawals: number;
    open_disputes: number;
    held_escrow_count: number;
    failed_settlements: number;
  };
};

export async function runSystemHealthChecks(): Promise<SystemHealthSnapshot> {
  const base = await runHealthChecks();
  const admin = createAdminClient();

  const checks: SystemHealthSnapshot["checks"] = {
    ...base.checks,
    realtime: "warn",
    blockchain: base.checks.payments,
    treasury: base.checks.payments,
    background_jobs: "warn",
    queue: "warn",
  };

  let pendingWebhooks = 0;
  let pendingWithdrawals = 0;
  let openDisputes = 0;
  let heldEscrow = 0;
  let failedSettlements = 0;

  try {
    const [
      { count: webhookCount },
      { count: withdrawalCount },
      { count: disputeCount },
      { count: escrowCount },
      { count: settlementCount },
    ] = await Promise.all([
      admin.from("webhook_deliveries").select("*", { count: "exact", head: true }).in("status", ["pending", "retrying"]),
      admin.from("withdrawal_requests").select("*", { count: "exact", head: true }).eq("status", "pending"),
      admin.from("disputes").select("*", { count: "exact", head: true }).in("status", ["open", "under_review", "awaiting_info"]),
      admin.from("escrows").select("*", { count: "exact", head: true }).eq("status", "held"),
      admin.from("settlements").select("*", { count: "exact", head: true }).eq("status", "failed"),
    ]);

    pendingWebhooks = webhookCount ?? 0;
    pendingWithdrawals = withdrawalCount ?? 0;
    openDisputes = disputeCount ?? 0;
    heldEscrow = escrowCount ?? 0;
    failedSettlements = settlementCount ?? 0;

    checks.realtime = process.env.NEXT_PUBLIC_SUPABASE_URL ? "ok" : "error";
    checks.background_jobs = process.env.CRON_SECRET ? "ok" : "warn";
    checks.queue = pendingWebhooks > 200 ? "error" : pendingWebhooks > 50 ? "warn" : "ok";
  } catch {
    checks.realtime = "error";
  }

  const hasError = Object.values(checks).some((v) => v === "error");
  const hasWarn = Object.values(checks).some((v) => v === "warn");

  return {
    status: hasError ? "unhealthy" : hasWarn ? "degraded" : "healthy",
    checks,
    timestamp: base.timestamp,
    metrics: {
      pending_webhooks: pendingWebhooks,
      pending_withdrawals: pendingWithdrawals,
      open_disputes: openDisputes,
      held_escrow_count: heldEscrow,
      failed_settlements: failedSettlements,
    },
  };
}
