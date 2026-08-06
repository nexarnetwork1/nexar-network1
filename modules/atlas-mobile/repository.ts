import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  MobileDevice,
  MobileOfflineQueueItem,
  MobilePushDelivery,
  MobileSyncCursor,
  RegisterDeviceInput,
  EnqueueOfflineMutationInput,
  QueuePushInput,
} from "./types";

function db() {
  return createAdminClient();
}

export async function getDeviceByFingerprint(
  userId: string,
  fingerprint: string,
): Promise<MobileDevice | null> {
  const { data } = await db()
    .from("atlas_mobile_devices")
    .select("*")
    .eq("user_id", userId)
    .eq("device_fingerprint", fingerprint)
    .maybeSingle();
  return (data as MobileDevice | null) ?? null;
}

export async function getDeviceById(
  deviceId: string,
): Promise<MobileDevice | null> {
  const { data } = await db()
    .from("atlas_mobile_devices")
    .select("*")
    .eq("id", deviceId)
    .maybeSingle();
  return (data as MobileDevice | null) ?? null;
}

export async function upsertDevice(
  input: RegisterDeviceInput,
): Promise<MobileDevice> {
  const existing = await getDeviceByFingerprint(
    input.userId,
    input.deviceFingerprint,
  );
  if (existing) {
    const { data, error } = await db()
      .from("atlas_mobile_devices")
      .update({
        platform: input.platform,
        business_id: input.businessId ?? existing.business_id,
        os_version: input.osVersion ?? existing.os_version,
        app_version: input.appVersion ?? existing.app_version,
        model: input.model ?? existing.model,
        biometrics_enabled:
          input.biometricsEnabled ?? existing.biometrics_enabled,
        pin_enabled: input.pinEnabled ?? existing.pin_enabled,
        status: "active",
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error || !data) throw new Error(error?.message ?? "Failed to update device");
    return data as MobileDevice;
  }

  const { data, error } = await db()
    .from("atlas_mobile_devices")
    .insert({
      user_id: input.userId,
      business_id: input.businessId ?? null,
      device_fingerprint: input.deviceFingerprint,
      platform: input.platform,
      os_version: input.osVersion ?? null,
      app_version: input.appVersion ?? null,
      model: input.model ?? null,
      biometrics_enabled: input.biometricsEnabled ?? false,
      pin_enabled: input.pinEnabled ?? false,
      last_seen_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to register device");
  return data as MobileDevice;
}

export async function createMobileSession(input: {
  deviceId: string;
  userId: string;
  authMethod: string;
  mfaVerified?: boolean;
  expiresAt?: string;
}): Promise<{ id: string }> {
  const { data, error } = await db()
    .from("atlas_mobile_sessions")
    .insert({
      device_id: input.deviceId,
      user_id: input.userId,
      auth_method: input.authMethod,
      mfa_verified: input.mfaVerified ?? false,
      expires_at: input.expiresAt ?? null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create session");
  return data as { id: string };
}

export async function endMobileSessionsForDevice(
  deviceId: string,
  reason: string,
): Promise<void> {
  await db()
    .from("atlas_mobile_sessions")
    .update({
      ended_at: new Date().toISOString(),
      end_reason: reason,
    })
    .eq("device_id", deviceId)
    .is("ended_at", null);
}

export async function revokeDevice(
  deviceId: string,
): Promise<MobileDevice> {
  const { data, error } = await db()
    .from("atlas_mobile_devices")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", deviceId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to revoke device");
  return data as MobileDevice;
}

export async function upsertPushToken(input: {
  deviceId: string;
  userId: string;
  provider: string;
  token: string;
}): Promise<void> {
  await db().from("atlas_mobile_push_tokens").upsert(
    {
      device_id: input.deviceId,
      user_id: input.userId,
      provider: input.provider,
      token: input.token,
      is_active: true,
      last_used_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "device_id,provider" },
  );
}

export async function insertPushDelivery(
  input: QueuePushInput,
): Promise<MobilePushDelivery> {
  const { data, error } = await db()
    .from("atlas_mobile_push_deliveries")
    .insert({
      user_id: input.userId,
      device_id: input.deviceId ?? null,
      business_id: input.businessId ?? null,
      category: input.category,
      title: input.title,
      body: input.body ?? null,
      payload: input.payload ?? {},
      deep_link: input.deepLink ?? null,
      status: "queued",
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to queue push");
  return data as MobilePushDelivery;
}

export async function listActiveDevicesForUser(
  userId: string,
): Promise<MobileDevice[]> {
  const { data } = await db()
    .from("atlas_mobile_devices")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active");
  return (data as MobileDevice[]) ?? [];
}

export async function enqueueOfflineMutation(
  input: EnqueueOfflineMutationInput,
): Promise<MobileOfflineQueueItem> {
  const { data, error } = await db()
    .from("atlas_mobile_offline_queue")
    .upsert(
      {
        device_id: input.deviceId,
        user_id: input.userId,
        business_id: input.businessId ?? null,
        client_mutation_id: input.clientMutationId,
        scope: input.scope,
        entity_type: input.entityType,
        entity_id: input.entityId ?? null,
        operation: input.operation,
        payload: input.payload,
        base_version: input.baseVersion ?? null,
        conflict_strategy: input.conflictStrategy ?? "last_write_wins",
        status: "pending",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "device_id,client_mutation_id" },
    )
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to enqueue mutation");
  return data as MobileOfflineQueueItem;
}

export async function listPendingOffline(
  deviceId: string,
  limit = 50,
): Promise<MobileOfflineQueueItem[]> {
  const { data } = await db()
    .from("atlas_mobile_offline_queue")
    .select("*")
    .eq("device_id", deviceId)
    .in("status", ["pending", "failed"])
    .order("created_at", { ascending: true })
    .limit(limit);
  return (data as MobileOfflineQueueItem[]) ?? [];
}

export async function markOfflineStatus(
  id: string,
  status: string,
  patch?: Record<string, unknown>,
): Promise<void> {
  await db()
    .from("atlas_mobile_offline_queue")
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...patch,
    })
    .eq("id", id);
}

export async function insertSyncConflict(input: {
  queueItemId: string;
  deviceId: string;
  strategy: string;
  clientPayload: Record<string, unknown>;
  serverPayload: Record<string, unknown>;
}): Promise<void> {
  await db().from("atlas_mobile_sync_conflicts").insert({
    queue_item_id: input.queueItemId,
    device_id: input.deviceId,
    strategy: input.strategy,
    client_payload: input.clientPayload,
    server_payload: input.serverPayload,
  });
}

export async function upsertSyncCursor(input: {
  deviceId: string;
  userId: string;
  businessId?: string;
  scope: string;
  cursorToken: string;
}): Promise<MobileSyncCursor> {
  const { data, error } = await db()
    .from("atlas_mobile_sync_cursors")
    .upsert(
      {
        device_id: input.deviceId,
        user_id: input.userId,
        business_id: input.businessId ?? null,
        scope: input.scope,
        cursor_token: input.cursorToken,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "device_id,scope,business_id" },
    )
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to upsert cursor");
  return data as MobileSyncCursor;
}

export async function listSyncCursors(
  deviceId: string,
): Promise<MobileSyncCursor[]> {
  const { data } = await db()
    .from("atlas_mobile_sync_cursors")
    .select("*")
    .eq("device_id", deviceId);
  return (data as MobileSyncCursor[]) ?? [];
}

export async function insertRemoteCommand(input: {
  deviceId: string;
  command: string;
  issuedBy?: string;
  payload?: Record<string, unknown>;
}): Promise<{ id: string }> {
  const { data, error } = await db()
    .from("atlas_mobile_remote_commands")
    .insert({
      device_id: input.deviceId,
      command: input.command,
      issued_by: input.issuedBy ?? null,
      payload: input.payload ?? {},
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to issue command");
  return data as { id: string };
}

export async function ensureDefaultWidgets(input: {
  userId: string;
  businessId?: string;
}): Promise<void> {
  const widgets = [
    "business_overview",
    "revenue",
    "orders",
    "notifications",
    "tasks",
    "meetings",
    "ai_insights",
    "quick_actions",
  ];
  await db().from("atlas_mobile_dashboard_widgets").upsert(
    widgets.map((widget_key, i) => ({
      user_id: input.userId,
      business_id: input.businessId ?? null,
      widget_key,
      sort_order: i,
      is_visible: true,
    })),
    { onConflict: "user_id,business_id,widget_key" },
  );
}

export async function ensureEntitlement(input: {
  userId: string;
  businessId?: string;
}): Promise<void> {
  const { data } = await db()
    .from("atlas_mobile_entitlements")
    .select("id")
    .eq("user_id", input.userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (data) return;
  await db().from("atlas_mobile_entitlements").insert({
    user_id: input.userId,
    business_id: input.businessId ?? null,
    plan: "free",
  });
}

export async function insertCameraJob(input: {
  deviceId: string;
  userId: string;
  businessId?: string;
  jobType: string;
  mediaPath?: string;
  result?: Record<string, unknown>;
}): Promise<{ id: string }> {
  const { data, error } = await db()
    .from("atlas_mobile_camera_jobs")
    .insert({
      device_id: input.deviceId,
      user_id: input.userId,
      business_id: input.businessId ?? null,
      job_type: input.jobType,
      status: "queued",
      media_path: input.mediaPath ?? null,
      result: input.result ?? {},
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create camera job");
  return data as { id: string };
}

export async function insertAnalyticsEvent(input: {
  deviceId?: string;
  userId?: string;
  businessId?: string;
  eventName: string;
  sessionId?: string;
  properties?: Record<string, unknown>;
}): Promise<void> {
  await db().from("atlas_mobile_analytics_events").insert({
    device_id: input.deviceId ?? null,
    user_id: input.userId ?? null,
    business_id: input.businessId ?? null,
    event_name: input.eventName,
    session_id: input.sessionId ?? null,
    properties: input.properties ?? {},
  });
}

export async function writeMobileAudit(input: {
  action: string;
  deviceId?: string;
  userId?: string;
  businessId?: string;
  actorUserId?: string;
  payload?: Record<string, unknown>;
}): Promise<void> {
  await db().from("atlas_mobile_audit_logs").insert({
    action: input.action,
    device_id: input.deviceId ?? null,
    user_id: input.userId ?? null,
    business_id: input.businessId ?? null,
    actor_user_id: input.actorUserId ?? null,
    payload: input.payload ?? {},
  });
}
