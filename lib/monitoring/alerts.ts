import { logger } from "@/lib/logging/logger";
import { writeSecurityLog } from "@/modules/audit/security";

export type AdminAlertType =
  | "payment_verification_failed"
  | "treasury_transfer_failed"
  | "merchant_transfer_failed"
  | "high_error_rate"
  | "security_attack"
  | "database_failure"
  | "blockchain_failure";

export type AdminAlertPayload = {
  type: AdminAlertType;
  message: string;
  metadata?: Record<string, unknown>;
};

const ALERT_EVENT_MAP: Record<AdminAlertType, "suspicious_activity" | "blocked_ip" | "rate_limit" | "invalid_token"> = {
  payment_verification_failed: "suspicious_activity",
  treasury_transfer_failed: "suspicious_activity",
  merchant_transfer_failed: "suspicious_activity",
  high_error_rate: "rate_limit",
  security_attack: "blocked_ip",
  database_failure: "invalid_token",
  blockchain_failure: "suspicious_activity",
};

export async function notifyAdminAlert(payload: AdminAlertPayload): Promise<void> {
  logger.error(`[admin-alert] ${payload.type}: ${payload.message}`, {
    type: payload.type,
    ...payload.metadata,
  });

  await writeSecurityLog({
    eventType: ALERT_EVENT_MAP[payload.type],
    metadata: {
      alertType: payload.type,
      message: payload.message,
      ...payload.metadata,
    },
  }).catch(() => undefined);

  const webhookUrl = process.env.ADMIN_ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const { assertSafeExternalUrl } = await import("@/lib/security/ssrf");
    const url = assertSafeExternalUrl(webhookUrl);
    await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: payload.type,
        message: payload.message,
        timestamp: new Date().toISOString(),
        metadata: payload.metadata ?? {},
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    logger.warn("Failed to deliver admin alert webhook", {
      type: payload.type,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
