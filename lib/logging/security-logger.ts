import { loggingConfig } from "@/config/logging";
import { logger } from "./logger";

export type SecurityEventType =
  | "auth_failed"
  | "auth_success"
  | "rate_limit_hit"
  | "csrf_failed"
  | "unauthorized_access"
  | "suspicious_input";

export type SecurityLogEntry = {
  event: SecurityEventType;
  ipAddress?: string;
  userId?: string;
  path?: string;
  metadata?: Record<string, unknown>;
};

export const securityLogger = {
  log(entry: SecurityLogEntry): void {
    if (!loggingConfig.security.enabled) return;

    logger.warn(`[security] ${entry.event}`, {
      ipAddress: entry.ipAddress,
      userId: entry.userId,
      path: entry.path,
      metadata: entry.metadata,
    });
  },

  authFailed(ipAddress?: string, metadata?: Record<string, unknown>): void {
    if (!loggingConfig.security.logFailedAuth) return;
    this.log({ event: "auth_failed", ipAddress, metadata });
  },

  rateLimitHit(ipAddress: string, path: string): void {
    if (!loggingConfig.security.logRateLimitHits) return;
    this.log({ event: "rate_limit_hit", ipAddress, path });
  },
};
