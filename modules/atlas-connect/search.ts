/**
 * ATLAS Connect — global search contracts.
 * Indexes messages, meetings, files, and cross-entity references.
 * Search execution is repository-backed; ranking rules live here.
 */

export type ConnectSearchScope =
  | "messages"
  | "meetings"
  | "files"
  | "businesses"
  | "employees"
  | "products"
  | "orders"
  | "invoices"
  | "customers";

export const CONNECT_SEARCH_SCOPES: readonly ConnectSearchScope[] = [
  "messages",
  "meetings",
  "files",
  "businesses",
  "employees",
  "products",
  "orders",
  "invoices",
  "customers",
] as const;

export type ConnectSearchHit = {
  scope: ConnectSearchScope;
  entityId: string;
  title: string;
  snippet: string | null;
  score: number;
  workspaceId: string;
  conversationId?: string;
  metadata?: Record<string, unknown>;
};

export type ConnectSearchQuery = {
  workspaceId: string;
  query: string;
  scopes?: ConnectSearchScope[];
  limit?: number;
};

/** Rank hits by lexical score then recency boost in metadata. */
export function rankSearchHits(hits: ConnectSearchHit[]): ConnectSearchHit[] {
  return [...hits].sort((a, b) => {
    const recencyA = Number(a.metadata?.recencyBoost ?? 0);
    const recencyB = Number(b.metadata?.recencyBoost ?? 0);
    return b.score + recencyB - (a.score + recencyA);
  });
}

/** Normalize query tokens for FTS / ILIKE backends. */
export function tokenizeSearchQuery(query: string): string[] {
  return query
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2)
    .slice(0, 12);
}

/** Simple in-memory score for unit tests / fallback ranking. */
export function scoreTextMatch(haystack: string, query: string): number {
  const tokens = tokenizeSearchQuery(query);
  if (!tokens.length) return 0;
  const lower = haystack.toLowerCase();
  let hits = 0;
  for (const token of tokens) {
    if (lower.includes(token)) hits += 1;
  }
  return hits / tokens.length;
}
