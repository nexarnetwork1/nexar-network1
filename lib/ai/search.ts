import { assistantSearch } from "@/modules/ai/global-assistant/search";
import type { AssistantSearchHit } from "@/modules/ai/global-assistant/types";

export { assistantSearch, extractSearchTerm, isSearchQuery } from "@/modules/ai/global-assistant/search";

export async function runPlatformSearch(query: string, limit = 5): Promise<AssistantSearchHit[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  return assistantSearch(trimmed, limit);
}

export function formatSearchResultsForModel(hits: AssistantSearchHit[]): string {
  if (!hits.length) return "No results found.";
  return hits
    .map((h, i) => `${i + 1}. [${h.type}] ${h.title} (${h.ref})${h.snippet ? ` — ${h.snippet}` : ""}`)
    .join("\n");
}
