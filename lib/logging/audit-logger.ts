import { loggingConfig } from "@/config/logging";
import { logger } from "./logger";

export type AuditLogEntry = {
  action: string;
  entityType: string;
  entityId?: string;
  actorId?: string;
  actorRole?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
};

export const auditLogger = {
  log(entry: AuditLogEntry): void {
    if (!loggingConfig.audit.enabled) return;

    logger.info(`[audit] ${entry.action}`, {
      entityType: entry.entityType,
      entityId: entry.entityId,
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      metadata: entry.metadata,
      ipAddress: entry.ipAddress,
      userAgent: entry.userAgent,
    });
  },
};
