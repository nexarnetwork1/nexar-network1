import { SITE } from "@/lib/constants/site";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import { COMMERCE_FAQ_ITEMS } from "@/lib/commerce/faq-content";
import { getPageKnowledge, summarizeCurrentPage } from "@/modules/ai/site-knowledge/page-index";
import { SITE_KNOWLEDGE } from "@/modules/ai/site-knowledge";
import { isNexarTopicQuery, searchKnowledgeEntries } from "@/modules/ai/site-knowledge/query-match";
import type { EnrichedAssistantContext } from "@/modules/ai/global-assistant/types";
import { assistantSearch } from "@/modules/ai/global-assistant/search";

let cachedKnowledgeDigest: string | null = null;

function buildStaticKnowledgeDigest(): string {
  if (cachedKnowledgeDigest) return cachedKnowledgeDigest;

  const curated = SITE_KNOWLEDGE.map(
    (entry) => `[${entry.title}] ${entry.answer.slice(0, 320)}`,
  ).join("\n\n");

  const faq = COMMERCE_FAQ_ITEMS.map(
    (item) => `FAQ: ${item.question} — ${item.answer.slice(0, 200)}`,
  ).join("\n");

  const nav = NAV_ITEMS.map((item) => `${item.label}: ${item.href}`).join("\n");

  cachedKnowledgeDigest = `Platform: ${SITE.name} (${SITE.ticker}) on ${SITE.blockchain}.
Website: ${SITE.url}
${SITE.description}

Navigation:
${nav}

Curated knowledge:
${curated}

Commerce FAQ:
${faq}`;
  return cachedKnowledgeDigest;
}

function shouldRunKnowledgeSearch(query: string, context: EnrichedAssistantContext): boolean {
  if (query.length < 3) return false;
  if (isNexarTopicQuery(query)) return true;

  return (
    /\b(find|search|look for|where|product|store|brand|category|order)\b/i.test(query) ||
    context.page.pageType === "shop"
  );
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

  if (shouldRunKnowledgeSearch(query, context)) {
    const matchedEntries = searchKnowledgeEntries(SITE_KNOWLEDGE, query, 4);
    if (matchedEntries.length) {
      const matchedBlock = matchedEntries
        .map((entry) => `### ${entry.title}\n${entry.answer}`)
        .join("\n\n");
      sections.push(`## Matched Nexar knowledge\n${matchedBlock}`);
    }

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
