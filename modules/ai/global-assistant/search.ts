import { globalSearch } from "@/modules/search/repository";
import { SITE_KNOWLEDGE } from "../site-knowledge";
import { PAGE_KNOWLEDGE } from "../site-knowledge/page-index";
import { scoreKnowledgeEntry } from "../site-knowledge/query-match";
import type { AssistantSearchHit } from "./types";

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function searchStaticKnowledge(query: string, limit: number): AssistantSearchHit[] {
  const q = normalize(query);
  const hits: AssistantSearchHit[] = [];

  const scoredEntries = SITE_KNOWLEDGE.map((entry) => ({
    entry,
    score: scoreKnowledgeEntry(entry, query),
  }))
    .filter(({ score }) => score >= 2)
    .sort((a, b) => b.score - a.score);

  for (const { entry, score } of scoredEntries) {
    hits.push({
      type: "knowledge",
      id: entry.id,
      title: entry.title,
      ref: entry.primaryLink ?? entry.links?.[0]?.href ?? "/",
      snippet: entry.answer.slice(0, 120),
    });
    if (hits.length >= limit) break;
  }

  if (hits.length < limit) {
    for (const page of PAGE_KNOWLEDGE) {
      const match =
        page.title.toLowerCase().includes(q) ||
        page.keywords.some((kw) => q.includes(kw) || kw.includes(q));
      if (match) {
        hits.push({
          type: "page",
          id: page.title,
          title: page.title,
          ref: page.pathPrefixes[0] ?? "/",
          snippet: page.summary.slice(0, 120),
        });
      }
      if (hits.length >= limit) break;
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

  for (const hit of [...staticHits, ...platformHits]) {
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
