import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types";
import type { RequestAuditContext } from "@/lib/security/request-context";

export type AuditChangeContext = RequestAuditContext & {
  beforeValue?: Record<string, unknown>;
  afterValue?: Record<string, unknown>;
};

export async function writeAuditLog(params: {
  actorId?: string | null;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  context?: AuditChangeContext;
}): Promise<void> {
  const supabase = createAdminClient();

  const metadata = {
    ...(params.metadata ?? {}),
    ...(params.context?.country ? { country: params.context.country } : {}),
    ...(params.context?.browser ? { browser: params.context.browser } : {}),
    ...(params.context?.beforeValue ? { beforeValue: params.context.beforeValue } : {}),
    ...(params.context?.afterValue ? { afterValue: params.context.afterValue } : {}),
  };

  await supabase.from("audit_logs").insert({
    actor_id: params.actorId ?? null,
    actor_role: params.actorRole,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    metadata,
    ip_address: params.context?.ipAddress ?? null,
    user_agent: params.context?.userAgent ?? null,
  });
}
