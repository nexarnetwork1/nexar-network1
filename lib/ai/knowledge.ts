import { SITE } from "@/lib/constants/site";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import { getPageKnowledge, summarizeCurrentPage } from "@/modules/ai/site-knowledge/page-index";
import { SITE_KNOWLEDGE } from "@/modules/ai/site-knowledge";
import type { EnrichedAssistantContext } from "@/modules/ai/global-assistant/types";
import { assistantSearch } from "@/modules/ai/global-assistant/search";

let cachedKnowledgeDigest: string | null = null;

function buildStaticKnowledgeDigest(): string {
  if (cachedKnowledgeDigest) return cachedKnowledgeDigest;

  const curated = SITE_KNOWLEDGE.map(
    (entry) => `[${entry.title}] ${entry.answer.slice(0, 280)}`,
  ).join("\n\n");

  const nav = NAV_ITEMS.map((item) => `${item.label}: ${item.href}`).join("\n");

  cachedKnowledgeDigest = `Platform: ${SITE.name} (${SITE.ticker}) on ${SITE.blockchain}.\n${SITE.description}\n\nNavigation:\n${nav}\n\nCurated knowledge:\n${curated}`;
  return cachedKnowledgeDigest;
}

/** Hybrid knowledge block — page first, then curated, then search if query warrants it. */
export async function assembleKnowledgeContext(
  context: EnrichedAssistantContext,
  query: string,
): Promise<string> {
  const sections: string[] = [];

  const pageSummary = summarizeCurrentPage(context.page);
  sections.push(`## Current page\n${pageSummary}`);

  const pageEntry = getPageKnowledge(context.page);
  if (pageEntry && pageEntry.summary !== pageSummary) {
    sections.push(`## Page documentation\n${pageEntry.summary}`);
  }

  sections.push(`## Platform knowledge\n${buildStaticKnowledgeDigest()}`);

  const shouldSearch =
    query.length >= 3 &&
    (/\b(find|search|look for|where|product|store|brand|category|order)\b/i.test(query) ||
      context.page.pageType === "shop");

  if (shouldSearch) {
    try {
      const hits = await assistantSearch(query, 5);
      if (hits.length) {
        const searchBlock = hits
          .map((h) => `- [${h.type}] ${h.title} → ${h.ref}${h.snippet ? `: ${h.snippet}` : ""}`)
          .join("\n");
        sections.push(`## Search results\n${searchBlock}`);
      }
    } catch {
      // Search is optional enrichment
    }
  }

  return sections.join("\n\n");
}

export function clearKnowledgeCache(): void {
  cachedKnowledgeDigest = null;
}
