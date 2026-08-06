/**
 * ATLAS AI — memory layer contracts (pure).
 */

import type { AiMemory, AiMemoryScope } from "./types";

export type MemoryWriteInput = {
  workspaceId: string;
  scope: AiMemoryScope;
  key: string;
  content: string;
  userId?: string;
  conversationId?: string;
  importance?: number;
};

export type MemoryQuery = {
  workspaceId: string;
  scopes?: AiMemoryScope[];
  userId?: string;
  conversationId?: string;
  query?: string;
  limit?: number;
};

export function scoreMemoryRelevance(
  memory: Pick<AiMemory, "content" | "importance" | "key">,
  query: string,
): number {
  const q = query.toLowerCase();
  const hay = `${memory.key} ${memory.content}`.toLowerCase();
  let score = memory.importance;
  if (hay.includes(q)) score += 0.4;
  for (const token of q.split(/\s+/).filter((t) => t.length > 2)) {
    if (hay.includes(token)) score += 0.05;
  }
  return Math.min(1, score);
}

export function filterMemoriesByScope(
  memories: AiMemory[],
  scopes?: AiMemoryScope[],
): AiMemory[] {
  if (!scopes?.length) return memories;
  const set = new Set(scopes);
  return memories.filter((m) => set.has(m.scope));
}

export function mergeMemoryCandidates(
  memories: AiMemory[],
  query: string,
  limit = 10,
): AiMemory[] {
  return [...memories]
    .map((m) => ({ m, score: scoreMemoryRelevance(m, query) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.m);
}
