import { globalSearch } from "@/modules/search/repository";
import { SITE_KNOWLEDGE } from "../site-knowledge";
import { PAGE_KNOWLEDGE } from "../site-knowledge/page-index";
import type { AssistantSearchHit } from "./types";

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function searchStaticKnowledge(query: string, limit: number): AssistantSearchHit[] {
  const q = normalize(query);
  const hits: AssistantSearchHit[] = [];

  for (const entry of SITE_KNOWLEDGE) {
    const match =
      entry.title.toLowerCase().includes(q) ||
      entry.keywords.some((kw) => q.includes(kw) || kw.includes(q));
    if (match) {
      hits.push({
        type: "knowledge",
        id: entry.id,
        title: entry.title,
        ref: entry.primaryLink ?? entry.links?.[0]?.href ?? "/",
        snippet: entry.answer.slice(0, 120),
      });
    }
  }

  for (const page of PAGE_KNOWLEDGE) {
    const match =
      page.title.toLowerCase().includes(q) ||
      page.keywords.some((kw) => q.includes(kw));
    if (match) {
      hits.push({
        type: "page",
        id: page.title,
        title: page.title,
        ref: page.pathPrefixes[0] ?? "/",
        snippet: page.summary.slice(0, 120),
      });
    }
  }

  return hits.slice(0, limit);
}

/** Hybrid search: platform RPC + static knowledge/pages. */
export async function assistantSearch(
  query: string,
  limit = 5,
): Promise<AssistantSearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return searchStaticKnowledge(trimmed, limit);

  const [platform, staticHits] = await Promise.all([
    globalSearch(trimmed, limit).catch(() => []),
    Promise.resolve(searchStaticKnowledge(trimmed, limit)),
  ]);

  const platformHits: AssistantSearchHit[] = platform.map((row) => ({
    type: row.type,
    id: row.id,
    title: row.title,
    ref: row.ref,
  }));

  const seen = new Set<string>();
  const merged: AssistantSearchHit[] = [];

  for (const hit of [...platformHits, ...staticHits]) {
    const key = `${hit.type}:${hit.ref}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(hit);
    if (merged.length >= limit) break;
  }

  return merged;
}

export function isSearchQuery(query: string): boolean {
  const q = normalize(query);
  return (
    q.startsWith("search ") ||
    q.startsWith("find ") ||
    q.startsWith("look for ") ||
    q.includes("search for") ||
    q.includes("where can i find")
  );
}

export function extractSearchTerm(query: string): string {
  return query
    .replace(/^(search|find|look)\s+(for\s+)?/i, "")
    .replace(/^where can i find\s+/i, "")
    .trim();
}
