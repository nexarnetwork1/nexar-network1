import { createAdminClient } from "@/lib/supabase/admin";
import type { UserRole } from "@/types";

export async function writeAuditLog(params: {
  actorId: string;
  actorRole: UserRole;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("audit_logs").insert({
    actor_id: params.actorId,
    actor_role: params.actorRole,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    metadata: params.metadata ?? {},
  });
}
