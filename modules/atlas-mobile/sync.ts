/**
 * ATLAS Mobile — sync engine contracts (pure).
 * Cloud-synced, realtime-ready; adapters plug in later.
 */

import type { MobileSyncScope } from "./types";

export type SyncPullRequest = {
  deviceId: string;
  scopes: MobileSyncScope[];
  cursors: Partial<Record<MobileSyncScope, string>>;
  businessId?: string;
};

export type SyncPullChunk = {
  scope: MobileSyncScope;
  cursorToken: string;
  records: Array<{
    entityType: string;
    entityId: string;
    version: number;
    payload: Record<string, unknown>;
    deleted?: boolean;
  }>;
  hasMore: boolean;
};

export type SyncPushResult = {
  accepted: string[];
  conflicts: string[];
  failed: Array<{ clientMutationId: string; error: string }>;
};

export type SyncPlan = {
  pull: MobileSyncScope[];
  pushPending: boolean;
  realtimeChannels: string[];
};

/** Build a sync plan from device capabilities / entitlements. */
export function buildSyncPlan(input: {
  scopes?: MobileSyncScope[];
  offlinePro?: boolean;
  includeRealtime?: boolean;
}): SyncPlan {
  const scopes =
    input.scopes && input.scopes.length
      ? input.scopes
      : (["business", "orders", "settings"] as MobileSyncScope[]);

  const pull = input.offlinePro
    ? ([
        ...new Set([
          ...scopes,
          "inventory",
          "crm",
          "connect",
          "wallet",
          "finance",
        ]),
      ] as MobileSyncScope[])
    : scopes;

  return {
    pull,
    pushPending: true,
    realtimeChannels: input.includeRealtime
      ? pull.map((s) => `atlas.mobile.sync.${s}`)
      : [],
  };
}

export function advanceCursor(
  current: string,
  nextHint?: string | number,
): string {
  if (typeof nextHint === "string" && nextHint.length) return nextHint;
  if (typeof nextHint === "number") return String(nextHint);
  const n = Number.parseInt(current, 10);
  if (Number.isFinite(n)) return String(n + 1);
  return current;
}

export function mergeCursors(
  existing: Partial<Record<MobileSyncScope, string>>,
  updates: Partial<Record<MobileSyncScope, string>>,
): Partial<Record<MobileSyncScope, string>> {
  return { ...existing, ...updates };
}
