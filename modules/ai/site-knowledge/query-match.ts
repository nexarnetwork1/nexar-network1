import type { SiteKnowledgeEntry } from "./types";

const NEXAR_TOPIC_PATTERN =
  /\b(nexar|nxr|token|presale|whitepaper|founder|mahmoud|elgabry|commerce|marketplace|merchant|customer|bsc|bep-?20|blockchain|payment|ecosystem|treasury|vesting|tokenomics|roadmap|telegram|discord|github|website|official)\b/i;

export function isNexarTopicQuery(query: string): boolean {
  const q = query.trim();
  if (q.length < 2) return false;
  return NEXAR_TOPIC_PATTERN.test(q);
}

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s#/?=&.-]/g, " ");
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/\s+/)
    .filter((token) => token.length >= 2);
}

/** Scores how well a knowledge entry matches a user query. */
export function scoreKnowledgeEntry(entry: SiteKnowledgeEntry, query: string): number {
  let score = 0;
  const normalizedQuery = normalize(query);
  const queryTokens = tokenize(query);

  if (normalizedQuery.includes(entry.id.replace(/-/g, " "))) score += 8;
  if (normalizedQuery.includes(entry.title.toLowerCase())) score += 6;

  for (const keyword of entry.keywords) {
    const kw = keyword.toLowerCase();
    if (normalizedQuery === kw) score += 14;
    else if (normalizedQuery.includes(kw)) score += kw.split(/\s+/).length + 3;
    else if (kw.includes(normalizedQuery) && normalizedQuery.length >= 4) score += 4;
  }

  for (const token of queryTokens) {
    if (entry.title.toLowerCase().includes(token)) score += 2;
    if (entry.id.includes(token)) score += 2;
    for (const keyword of entry.keywords) {
      if (keyword.toLowerCase().includes(token)) score += 1;
    }
  }

  return score;
}

export function findBestKnowledgeEntry(
  entries: SiteKnowledgeEntry[],
  query: string,
  minScore = 3,
): SiteKnowledgeEntry | null {
  let best: SiteKnowledgeEntry | null = null;
  let bestScore = 0;

  for (const entry of entries) {
    const score = scoreKnowledgeEntry(entry, query);
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  return bestScore >= minScore ? best : null;
}

export function searchKnowledgeEntries(
  entries: SiteKnowledgeEntry[],
  query: string,
  limit = 5,
): SiteKnowledgeEntry[] {
  const scored = entries
    .map((entry) => ({ entry, score: scoreKnowledgeEntry(entry, query) }))
    .filter(({ score }) => score >= 2)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ entry }) => entry);
}
