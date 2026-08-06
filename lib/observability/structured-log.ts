/**
 * Observability contracts for production — Sentry already wired in instrumentation.
 * Structured logging + health snapshot helpers (no new product features).
 */

export type StructuredLogLevel = "debug" | "info" | "warn" | "error";

export type StructuredLogEvent = {
  level: StructuredLogLevel;
  message: string;
  service?: string;
  requestId?: string;
  userId?: string | null;
  businessId?: string | null;
  metadata?: Record<string, unknown>;
};

export function emitStructuredLog(event: StructuredLogEvent): void {
  const payload = {
    ts: new Date().toISOString(),
    ...event,
  };
  if (event.level === "error") {
    console.error(JSON.stringify(payload));
  } else if (event.level === "warn") {
    console.warn(JSON.stringify(payload));
  } else {
    console.info(JSON.stringify(payload));
  }
}

export type PlatformHealthSnapshot = {
  status: "ok" | "degraded" | "down";
  checks: Record<string, "ok" | "fail" | "skip">;
  at: string;
};

export function buildHealthSnapshot(
  checks: Record<string, "ok" | "fail" | "skip">,
): PlatformHealthSnapshot {
  const values = Object.values(checks);
  const status = values.includes("fail")
    ? "degraded"
    : values.every((v) => v === "ok" || v === "skip")
      ? "ok"
      : "degraded";
  return { status, checks, at: new Date().toISOString() };
}
