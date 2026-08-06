/**
 * ATLAS Mobile — offline-first queue & conflict resolution (pure).
 */

import type { MobileConflictStrategy } from "./types";

export type OfflineMutationDraft = {
  clientMutationId: string;
  entityType: string;
  entityId?: string | null;
  operation: "create" | "update" | "delete" | "upsert";
  payload: Record<string, unknown>;
  baseVersion?: number | null;
  clientUpdatedAt?: string;
  conflictStrategy?: MobileConflictStrategy;
};

export type ServerRecordSnapshot = {
  entityId: string;
  version: number;
  updatedAt: string;
  payload: Record<string, unknown>;
};

export type ConflictResolution = {
  status: "apply" | "conflict" | "discard";
  strategy: MobileConflictStrategy;
  resolvedPayload?: Record<string, unknown>;
  reason: string;
};

/** Resolve client vs server when versions diverge. */
export function resolveConflict(input: {
  mutation: OfflineMutationDraft;
  server: ServerRecordSnapshot | null;
  strategy?: MobileConflictStrategy;
}): ConflictResolution {
  const strategy =
    input.strategy ?? input.mutation.conflictStrategy ?? "last_write_wins";

  if (!input.server) {
    return {
      status: "apply",
      strategy,
      resolvedPayload: input.mutation.payload,
      reason: "No server record — apply client",
    };
  }

  const base = input.mutation.baseVersion ?? null;
  if (base !== null && base === input.server.version) {
    return {
      status: "apply",
      strategy,
      resolvedPayload: input.mutation.payload,
      reason: "Base version matches — no conflict",
    };
  }

  if (input.mutation.operation === "delete" && strategy === "client_wins") {
    return {
      status: "apply",
      strategy,
      resolvedPayload: {},
      reason: "Client delete wins",
    };
  }

  switch (strategy) {
    case "server_wins":
      return {
        status: "discard",
        strategy,
        resolvedPayload: input.server.payload,
        reason: "Server wins strategy",
      };
    case "client_wins":
      return {
        status: "apply",
        strategy,
        resolvedPayload: input.mutation.payload,
        reason: "Client wins strategy",
      };
    case "last_write_wins": {
      const clientTs = Date.parse(input.mutation.clientUpdatedAt ?? "") || 0;
      const serverTs = Date.parse(input.server.updatedAt) || 0;
      if (clientTs >= serverTs) {
        return {
          status: "apply",
          strategy,
          resolvedPayload: input.mutation.payload,
          reason: "Client newer (LWW)",
        };
      }
      return {
        status: "discard",
        strategy,
        resolvedPayload: input.server.payload,
        reason: "Server newer (LWW)",
      };
    }
    case "manual_merge":
      return {
        status: "conflict",
        strategy,
        reason: "Manual merge required",
      };
    default:
      return {
        status: "conflict",
        strategy,
        reason: "Unknown strategy",
      };
  }
}

export type OfflineQueueBatch = {
  mutations: OfflineMutationDraft[];
  maxBatchSize: number;
};

/** Order mutations for sync: creates → upserts/updates → deletes. */
export function prioritizeOfflineBatch(
  mutations: OfflineMutationDraft[],
  maxBatchSize = 50,
): OfflineMutationDraft[] {
  const rank = (op: string) =>
    op === "create" ? 0 : op === "upsert" || op === "update" ? 1 : 2;
  return [...mutations]
    .sort((a, b) => rank(a.operation) - rank(b.operation))
    .slice(0, maxBatchSize);
}

export function isOfflineCapableScope(scope: string): boolean {
  return [
    "orders",
    "inventory",
    "crm",
    "business",
    "connect",
    "settings",
    "all",
  ].includes(scope);
}
