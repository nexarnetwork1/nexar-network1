import "server-only";

import { randomUUID } from "node:crypto";
import { publishDomainEvent, type DomainEvent } from "@/domains";
import type {
  AtlasMobilePort,
  MobileDeviceRecord,
  MobileOfflineMutationRecord,
  MobilePushDeliveryRecord,
} from "@/domains/contracts/ports";
import { createCameraJobStub } from "./camera";
import { parseDeepLink } from "./deep-links";
import {
  prioritizeOfflineBatch,
  resolveConflict,
  isOfflineCapableScope,
} from "./offline";
import { buildPushPayload, pushCategoryForEvent } from "./push";
import { advanceCursor, buildSyncPlan } from "./sync";
import {
  createMobileSession,
  endMobileSessionsForDevice,
  enqueueOfflineMutation,
  ensureDefaultWidgets,
  ensureEntitlement,
  getDeviceById,
  insertAnalyticsEvent,
  insertCameraJob,
  insertPushDelivery,
  insertRemoteCommand,
  insertSyncConflict,
  listActiveDevicesForUser,
  listPendingOffline,
  listSyncCursors,
  markOfflineStatus,
  revokeDevice,
  upsertDevice,
  upsertPushToken,
  upsertSyncCursor,
  writeMobileAudit,
} from "./repository";
import type {
  EnqueueOfflineMutationInput,
  MobileDevice,
  QueuePushInput,
  RegisterDeviceInput,
  MobileSyncScope,
} from "./types";
import {
  enqueueOfflineSchema,
  queuePushSchema,
  registerDeviceSchema,
  syncPullSchema,
} from "./validators";

async function emit(
  name: DomainEvent["name"],
  input: {
    actorId: string | null;
    businessId: string | null;
    payload: Record<string, unknown>;
  },
) {
  await publishDomainEvent({
    id: randomUUID(),
    name,
    occurredAt: new Date(),
    actorId: input.actorId,
    businessId: input.businessId,
    payload: input.payload,
    correlationId: randomUUID(),
  });
}

function toDeviceRecord(d: MobileDevice): MobileDeviceRecord {
  return {
    id: d.id,
    userId: d.user_id,
    businessId: d.business_id,
    platform: d.platform,
    status: d.status,
    appVersion: d.app_version,
    lastSeenAt: d.last_seen_at ? new Date(d.last_seen_at) : null,
  };
}

export async function registerMobileDevice(
  input: RegisterDeviceInput,
): Promise<MobileDeviceRecord> {
  registerDeviceSchema.parse(input);
  const device = await upsertDevice(input);
  await createMobileSession({
    deviceId: device.id,
    userId: input.userId,
    authMethod: input.biometricsEnabled
      ? "face_id"
      : input.pinEnabled
        ? "pin"
        : "password",
  });
  await ensureDefaultWidgets({
    userId: input.userId,
    businessId: input.businessId,
  });
  await ensureEntitlement({
    userId: input.userId,
    businessId: input.businessId,
  });

  await writeMobileAudit({
    action: "device_registered",
    deviceId: device.id,
    userId: input.userId,
    businessId: input.businessId,
    actorUserId: input.userId,
  });

  await emit("mobile.device_registered", {
    actorId: input.userId,
    businessId: input.businessId ?? null,
    payload: { deviceId: device.id, platform: device.platform },
  });

  await insertAnalyticsEvent({
    deviceId: device.id,
    userId: input.userId,
    businessId: input.businessId,
    eventName: "device_registered",
    properties: { platform: device.platform },
  });

  return toDeviceRecord(device);
}

export async function registerPushToken(input: {
  deviceId: string;
  userId: string;
  provider?: string;
  token: string;
}): Promise<void> {
  await upsertPushToken({
    deviceId: input.deviceId,
    userId: input.userId,
    provider: input.provider ?? "fcm",
    token: input.token,
  });
}

export async function queueMobilePush(
  input: QueuePushInput,
): Promise<MobilePushDeliveryRecord> {
  queuePushSchema.parse(input);
  const built = buildPushPayload({
    category: input.category,
    title: input.title,
    body: input.body,
    deepLink: input.deepLink,
    data: input.payload,
  });
  const delivery = await insertPushDelivery({
    ...input,
    payload: { ...(input.payload ?? {}), priority: built.priority },
  });

  await emit("mobile.push_queued", {
    actorId: input.userId,
    businessId: input.businessId ?? null,
    payload: {
      deliveryId: delivery.id,
      category: input.category,
      deepLink: input.deepLink,
    },
  });

  return {
    id: delivery.id,
    userId: delivery.user_id,
    category: delivery.category,
    title: delivery.title,
    status: delivery.status,
    deepLink: delivery.deep_link,
  };
}

export async function enqueueMobileOfflineMutation(
  input: EnqueueOfflineMutationInput,
): Promise<MobileOfflineMutationRecord> {
  enqueueOfflineSchema.parse(input);
  if (!isOfflineCapableScope(input.scope) && input.scope !== "all") {
    // still allow enqueue — client may sync when online for non-offline scopes
  }
  const item = await enqueueOfflineMutation(input);

  await emit("mobile.offline_mutation_queued", {
    actorId: input.userId,
    businessId: input.businessId ?? null,
    payload: {
      queueItemId: item.id,
      clientMutationId: input.clientMutationId,
      scope: input.scope,
    },
  });

  return {
    id: item.id,
    deviceId: item.device_id,
    clientMutationId: item.client_mutation_id,
    scope: item.scope,
    status: item.status,
    entityType: item.entity_type,
  };
}

export async function processOfflineSyncBatch(input: {
  deviceId: string;
  userId: string;
}): Promise<{
  accepted: string[];
  conflicts: string[];
  failed: Array<{ clientMutationId: string; error: string }>;
}> {
  const pending = await listPendingOffline(input.deviceId);
  const batch = prioritizeOfflineBatch(
    pending.map((p) => ({
      clientMutationId: p.client_mutation_id,
      entityType: p.entity_type,
      entityId: p.entity_id,
      operation: p.operation,
      payload: p.payload,
      baseVersion: p.base_version,
      conflictStrategy: p.conflict_strategy,
    })),
  );

  const accepted: string[] = [];
  const conflicts: string[] = [];
  const failed: Array<{ clientMutationId: string; error: string }> = [];

  for (const draft of batch) {
    const row = pending.find(
      (p) => p.client_mutation_id === draft.clientMutationId,
    );
    if (!row) continue;

    // Foundation: no server entity fetch yet — treat as apply when no base conflict marker
    const resolution = resolveConflict({
      mutation: draft,
      server: null,
    });

    if (resolution.status === "apply") {
      await markOfflineStatus(row.id, "synced", {
        synced_at: new Date().toISOString(),
      });
      accepted.push(draft.clientMutationId);
    } else if (resolution.status === "conflict") {
      await markOfflineStatus(row.id, "conflict");
      await insertSyncConflict({
        queueItemId: row.id,
        deviceId: input.deviceId,
        strategy: resolution.strategy,
        clientPayload: draft.payload,
        serverPayload: {},
      });
      conflicts.push(draft.clientMutationId);
      await emit("mobile.sync_conflict", {
        actorId: input.userId,
        businessId: row.business_id,
        payload: { clientMutationId: draft.clientMutationId },
      });
    } else {
      await markOfflineStatus(row.id, "discarded");
      failed.push({
        clientMutationId: draft.clientMutationId,
        error: resolution.reason,
      });
    }
  }

  await emit("mobile.sync_completed", {
    actorId: input.userId,
    businessId: null,
    payload: {
      deviceId: input.deviceId,
      accepted: accepted.length,
      conflicts: conflicts.length,
      failed: failed.length,
    },
  });

  return { accepted, conflicts, failed };
}

export async function pullMobileSync(input: {
  deviceId: string;
  userId: string;
  businessId?: string;
  scopes: MobileSyncScope[];
}): Promise<{
  plan: ReturnType<typeof buildSyncPlan>;
  cursors: Partial<Record<MobileSyncScope, string>>;
}> {
  syncPullSchema.parse(input);
  const plan = buildSyncPlan({
    scopes: input.scopes,
    offlinePro: false,
    includeRealtime: true,
  });

  const existing = await listSyncCursors(input.deviceId);
  const cursors: Partial<Record<MobileSyncScope, string>> = {};
  for (const scope of plan.pull) {
    const cur = existing.find((c) => c.scope === scope);
    const next = advanceCursor(cur?.cursor_token ?? "0");
    await upsertSyncCursor({
      deviceId: input.deviceId,
      userId: input.userId,
      businessId: input.businessId,
      scope,
      cursorToken: next,
    });
    cursors[scope] = next;
  }

  return { plan, cursors };
}

export async function remoteLogoutDevice(input: {
  deviceId: string;
  issuedBy: string;
}): Promise<void> {
  const device = await getDeviceById(input.deviceId);
  if (!device) throw new Error("Device not found");

  await endMobileSessionsForDevice(input.deviceId, "remote_logout");
  await insertRemoteCommand({
    deviceId: input.deviceId,
    command: "logout",
    issuedBy: input.issuedBy,
  });
  await revokeDevice(input.deviceId);

  await writeMobileAudit({
    action: "remote_logout",
    deviceId: input.deviceId,
    userId: device.user_id,
    actorUserId: input.issuedBy,
  });

  await emit("mobile.device_revoked", {
    actorId: input.issuedBy,
    businessId: device.business_id,
    payload: { deviceId: input.deviceId, reason: "remote_logout" },
  });
}

export async function startCameraScan(input: {
  deviceId: string;
  userId: string;
  businessId?: string;
  jobType: Parameters<typeof createCameraJobStub>[0]["jobType"];
  mediaPath?: string;
}): Promise<{ jobId: string; stub: ReturnType<typeof createCameraJobStub> }> {
  const stub = createCameraJobStub({
    jobType: input.jobType,
    mediaPath: input.mediaPath,
  });
  const job = await insertCameraJob({
    deviceId: input.deviceId,
    userId: input.userId,
    businessId: input.businessId,
    jobType: input.jobType,
    mediaPath: input.mediaPath,
    result: stub.extracted,
  });
  return { jobId: job.id, stub };
}

export async function resolveMobileDeepLink(url: string) {
  return parseDeepLink(url);
}

export async function handleMobileDomainEvent(input: {
  name: string;
  actorId: string | null;
  businessId: string | null;
  payload: Record<string, unknown>;
}): Promise<void> {
  const category = pushCategoryForEvent(input.name);
  if (!category) return;

  const userId =
    (input.payload.userId as string | undefined) ??
    (input.payload.customerId as string | undefined) ??
    input.actorId;
  if (!userId) return;

  const devices = await listActiveDevicesForUser(userId);
  if (!devices.length) return;

  const title =
    (input.payload.title as string | undefined) ??
    category.replace(/_/g, " ");
  for (const device of devices.filter((d) => d.push_enabled)) {
    await queueMobilePush({
      userId,
      deviceId: device.id,
      businessId: input.businessId ?? undefined,
      category,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      body: (input.payload.body as string | undefined) ?? undefined,
      payload: input.payload,
      deepLink: (input.payload.deepLink as string | undefined) ?? undefined,
    });
  }
}

export function createAtlasMobilePort(): AtlasMobilePort {
  return {
    async registerDevice(input) {
      return registerMobileDevice({
        ...input,
        platform: input.platform as RegisterDeviceInput["platform"],
      });
    },
    async queuePush(input) {
      return queueMobilePush({
        ...input,
        category: input.category as QueuePushInput["category"],
      });
    },
    async enqueueOfflineMutation(input) {
      return enqueueMobileOfflineMutation({
        ...input,
        scope: input.scope as EnqueueOfflineMutationInput["scope"],
        conflictStrategy:
          input.conflictStrategy as EnqueueOfflineMutationInput["conflictStrategy"],
      });
    },
    async processOfflineSync(input) {
      return processOfflineSyncBatch(input);
    },
    async pullSync(input) {
      const result = await pullMobileSync({
        ...input,
        scopes: input.scopes as MobileSyncScope[],
      });
      return {
        plan: result.plan,
        cursors: result.cursors as Record<string, string>,
      };
    },
    async remoteLogout(input) {
      await remoteLogoutDevice(input);
    },
    async parseDeepLink(url) {
      return resolveMobileDeepLink(url);
    },
  };
}

export {
  buildSyncPlan,
  buildPushPayload,
  pushCategoryForEvent,
  resolveConflict,
  prioritizeOfflineBatch,
  parseDeepLink,
  createCameraJobStub,
};
