import { createAdminClient } from "@/lib/supabase/admin";
import type { SecurityEventType, SecurityLog } from "@/types";

export async function writeSecurityLog(params: {
  eventType: SecurityEventType;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const admin = createAdminClient();
  await admin.from("security_logs").insert({
    event_type: params.eventType,
    user_id: params.userId ?? null,
    ip_address: params.ipAddress ?? null,
    user_agent: params.userAgent ?? null,
    metadata: params.metadata ?? {},
  });
}

export async function getRecentSecurityLogs(
  limit = 20
): Promise<SecurityLog[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("security_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as SecurityLog[];
}
