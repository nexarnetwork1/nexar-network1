import {
  ASSISTANT_SUGGESTED_PROMPTS,
  NAVIGATION_ALIASES,
  SITE_KNOWLEDGE,
  type SiteKnowledgeEntry,
  type SiteKnowledgeLink,
} from "../site-knowledge";
import { findBestKnowledgeEntry, isNexarTopicQuery, searchKnowledgeEntries } from "../site-knowledge/query-match";
import { getSectionKnowledge, summarizeCurrentPage } from "../site-knowledge/page-index";
import { resolveContextualQuery, isContextualQuery } from "./conversation";
import {
  filterActionsForRole,
  pickActionsForPage,
  pickActionsForTopic,
} from "./navigation-actions";
import { assistantSearch, extractSearchTerm, isSearchQuery } from "./search";
import {
  convertNxrAmount,
  fetchNxrMarketSnapshot,
  formatConversionForModel,
  formatMarketSnapshotForModel,
} from "@/lib/ai/market-data";
import { formatWhitepaperSectionsForModel, searchWhitepaperSections } from "@/lib/ai/whitepaper-knowledge";
import type {
  AssistantAction,
  EnrichedAssistantContext,
  GlobalAssistantResult,
} from "./types";

const NAVIGATION_VERBS =
  /^(?:take me to|go to|open|navigate to|show me|visit|bring me to|launch)\s+/i;

function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s#/?=&.-]/g, " ");
}

function findBestEntry(query: string): SiteKnowledgeEntry | null {
  return findBestKnowledgeEntry(SITE_KNOWLEDGE, query, 3);
}

function resolveNavigationTarget(query: string): string | null {
  const stripped = query.replace(NAVIGATION_VERBS, "").trim();
  const target = normalize(stripped);

  if (NAVIGATION_ALIASES[target]) return NAVIGATION_ALIASES[target];

  for (const [alias, href] of Object.entries(NAVIGATION_ALIASES)) {
    if (target.includes(alias)) return href;
  }

  for (const entry of SITE_KNOWLEDGE) {
    if (entry.keywords.some((kw) => target.includes(kw.toLowerCase()))) {
      return entry.primaryLink ?? entry.links?.[0]?.href ?? null;
    }
  }

  return null;
}

function adaptAnswerForRole(
  entry: SiteKnowledgeEntry,
  context: EnrichedAssistantContext,
): string {
  const { userRole, page } = context;

  if (entry.id === "merchant") {
    if (userRole === "guest" || userRole === "customer") {
      return "To sell on Nexar Commerce, register as a merchant, create your store profile, and await approval. Once approved, list products from your merchant dashboard.";
    }
    if (userRole === "merchant") {
      const storeHint = page.entityName ? ` for ${page.entityName}` : "";
      return `From your merchant dashboard${storeHint}, add products under Products → New, configure your store, and publish listings. Pending stores must be approved before appearing on the marketplace.`;
    }
    if (userRole === "treasury_admin" || userRole === "admin") {
      return "Manage merchant onboarding, store verification, and marketplace moderation from the admin dashboard.";
    }
  }

  if (entry.id === "customer" && userRole === "customer") {
    return "From your customer dashboard you can track orders, pay invoices, manage your wishlist, and checkout on the marketplace.";
  }

  if (entry.id === "admin" && (userRole === "treasury_admin" || userRole === "admin")) {
    return "You have treasury admin access. Use the admin dashboard to manage merchants, orders, verification, platform settings, and marketplace operations.";
  }

  return entry.answer;
}

function answerCurrentPage(context: EnrichedAssistantContext): GlobalAssistantResult | null {
  const q = context.conversationHistory.at(-1)?.content ?? "";
  const normalized = normalize(q);

  const asksAboutPage =
    isContextualQuery(q) ||
    normalized.includes("this page") ||
    normalized.includes("this section") ||
    normalized.includes("explain this") ||
    normalized.includes("what is this") ||
    normalized.includes("what does it do") ||
    normalized.includes("what am i looking at");

  if (!asksAboutPage) return null;

  const section = getSectionKnowledge(context.page);
  if (section) {
    return {
      content: `${section.title}\n\n${section.summary}`,
      links: context.page.sectionId
        ? [{ label: "This section", href: `${context.pathname}#${context.page.sectionId}` }]
        : [],
      actions: pickActionsForPage(context.page.pageType, context.userRole),
      suggestedPrompts: suggestPromptsForContext(context),
      matchedTopic: section.title,
      mode: "demo",
    };
  }

  const summary = summarizeCurrentPage(context.page);
  return {
    content: summary,
    links: [{ label: `Stay on ${context.page.label}`, href: context.pathname }],
    actions: pickActionsForPage(context.page.pageType, context.userRole),
    suggestedPrompts: suggestPromptsForContext(context),
    matchedTopic: context.page.label,
    mode: "demo",
  };
}

function suggestPromptsForContext(context: EnrichedAssistantContext): string[] {
  const base = [...ASSISTANT_SUGGESTED_PROMPTS];
  if (context.page.pageType === "product") {
    return ["Add to cart", "Who sells this?", "Open Shop", ...base.slice(0, 4)];
  }
  if (context.page.pageType === "merchant") {
    return ["How do I add a product?", "View orders", "Store settings", ...base.slice(0, 4)];
  }
  if (context.page.pageType === "whitepaper") {
    return ["Explain tokenomics", "Explain this section", "Open Roadmap", ...base.slice(0, 4)];
  }
  return base;
}

function buildFallback(context: EnrichedAssistantContext): GlobalAssistantResult {
  return {
    content: `I'm the Nexar Assistant — your enterprise guide to Nexar Network.\n\nYou're on **${context.page.label}** (${context.pathname}) as a ${context.userRole.replace("_", " ")}.\n\nAsk about NXR, the marketplace, merchant tools, or say "Open Marketplace".`,
    links: [
      { label: "Marketplace", href: "/marketplace" },
      { label: "Whitepaper", href: "/whitepaper" },
    ],
    actions: filterActionsForRole(context.userRole),
    suggestedPrompts: suggestPromptsForContext(context),
    mode: "demo",
  };
}

function mergeLinksAndActions(
  links: SiteKnowledgeLink[],
  actions: AssistantAction[],
): { links: SiteKnowledgeLink[]; actions: AssistantAction[] } {
  const seen = new Set<string>();
  const mergedLinks: SiteKnowledgeLink[] = [];
  const mergedActions: AssistantAction[] = [];

  for (const link of links) {
    if (!seen.has(link.href)) {
      seen.add(link.href);
      mergedLinks.push(link);
    }
  }

  for (const action of actions) {
    if (!seen.has(action.href)) {
      seen.add(action.href);
      mergedActions.push(action);
    }
  }

  return { links: mergedLinks, actions: mergedActions };
}

export async function resolveGlobalAssistantQuery(
  query: string,
  context: EnrichedAssistantContext,
): Promise<GlobalAssistantResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return buildFallback(context);
  }

  const { rewritten, usedContext } = resolveContextualQuery(trimmed, context);
  const effectiveQuery = usedContext ? rewritten : trimmed;
  const normalized = normalize(effectiveQuery);

  if (isSearchQuery(trimmed)) {
    const term = extractSearchTerm(trimmed) || trimmed;
    const results = await assistantSearch(term, 5);
    if (results.length) {
      const lines = results.map((r) => `• ${r.title} (${r.type})`).join("\n");
      return {
        content: `Here are the most relevant results for "${term}":\n\n${lines}`,
        links: results.slice(0, 4).map((r) => ({ label: r.title, href: r.ref })),
        actions: results.slice(0, 3).map((r) => ({ label: `Open ${r.title}`, href: r.ref })),
        searchResults: results,
        suggestedPrompts: suggestPromptsForContext(context),
        matchedTopic: "Search",
        mode: "demo",
      };
    }
    return {
      content: `I couldn't find results for "${term}". Try searching the marketplace shop or ask about Nexar Network, NXR, or merchant onboarding.`,
      links: [{ label: "Marketplace", href: "/marketplace" }],
      actions: filterActionsForRole(context.userRole),
      suggestedPrompts: suggestPromptsForContext(context),
      matchedTopic: "Search",
      mode: "demo",
    };
  }

  const pageAnswer = answerCurrentPage({ ...context, conversationHistory: [{ role: "user", content: trimmed }] });
  if (pageAnswer) {
    return pageAnswer;
  }

  if (/\b(convert|how much is|worth in|كام|جنيه|دولار)\b/i.test(trimmed)) {
    const amountMatch = trimmed.match(/(\d+(?:\.\d+)?)\s*nxr/i);
    if (amountMatch) {
      const amount = Number.parseFloat(amountMatch[1]);
      const conversion = await convertNxrAmount(amount);
      if (conversion) {
        return {
          content: formatConversionForModel(conversion),
          links: [{ label: "Open Market", href: "/market" }],
          actions: [{ label: "Open Market", href: "/market" }],
          cards: [
            {
              type: "market",
              symbol: conversion.symbol,
              priceUsd: conversion.priceUsd,
              amount: conversion.amount,
              convertedValues: conversion.conversions,
              href: "/market",
              live: true,
            },
          ],
          suggestedPrompts: suggestPromptsForContext(context),
          matchedTopic: "NXR Conversion",
          mode: "demo",
        };
      }
    }
  }

  if (/\b(price|market data|nxr price|سعر)\b/i.test(trimmed)) {
    const snapshot = await fetchNxrMarketSnapshot();
    return {
      content: formatMarketSnapshotForModel(snapshot),
      links: [{ label: "Open Market", href: "/market" }],
      actions: [{ label: "Open Market", href: "/market" }],
      cards: [
        {
          type: "market",
          symbol: snapshot.symbol,
          priceUsd: snapshot.priceUsd,
          change24h: snapshot.change24h,
          href: "/market",
          live: snapshot.source === "coingecko" && snapshot.priceUsd != null,
        },
      ],
      suggestedPrompts: suggestPromptsForContext(context),
      matchedTopic: "NXR Market",
      mode: "demo",
    };
  }

  if (/\b(whitepaper|tokenomics section|roadmap section)\b/i.test(trimmed)) {
    const sections = searchWhitepaperSections(trimmed, 2);
    if (sections.length) {
      return {
        content: formatWhitepaperSectionsForModel(sections),
        links: [{ label: "Open Whitepaper", href: "/whitepaper" }],
        actions: [{ label: "Open Whitepaper", href: "/whitepaper" }],
        cards: sections.map((section) => ({
          type: "document" as const,
          title: section.title,
          excerpt: section.body.slice(0, 220),
          href: `/whitepaper#${section.id}`,
        })),
        suggestedPrompts: suggestPromptsForContext(context),
        matchedTopic: "Whitepaper",
        mode: "demo",
      };
    }
  }

  if (NAVIGATION_VERBS.test(trimmed) || normalized.startsWith("open ")) {
    const href = resolveNavigationTarget(trimmed);
    if (href) {
      const entry = SITE_KNOWLEDGE.find(
        (item) => item.primaryLink === href || item.links?.some((link) => link.href === href),
      );
      return {
        content: entry
          ? `${entry.answer.split("\n")[0]}\n\nOpening ${entry.title} for you.`
          : `Navigating you now.`,
        links: [{ label: "Go to page", href }],
        actions: [{ label: "Go to page", href }],
        navigateTo: href,
        suggestedPrompts: suggestPromptsForContext(context),
        matchedTopic: entry?.title ?? "Navigation",
        mode: "demo",
      };
    }
  }

  const best = findBestEntry(effectiveQuery);
  if (best) {
    const content = adaptAnswerForRole(best, context);
    const topicActions = pickActionsForTopic(best.title, context.userRole);
    const { links, actions } = mergeLinksAndActions(best.links ?? [], topicActions);

    return {
      content,
      links,
      actions,
      navigateTo: best.primaryLink,
      suggestedPrompts: suggestPromptsForContext(context),
      matchedTopic: best.title,
      mode: "demo",
    };
  }

  if (isNexarTopicQuery(effectiveQuery)) {
    const knowledgeHits = searchKnowledgeEntries(SITE_KNOWLEDGE, effectiveQuery, 3);
    if (knowledgeHits.length) {
      const primary = knowledgeHits[0];
      const extra = knowledgeHits.slice(1, 3).map((entry) => entry.title).join(", ");
      const content = adaptAnswerForRole(primary, context);
      const topicActions = pickActionsForTopic(primary.title, context.userRole);
      const { links, actions } = mergeLinksAndActions(primary.links ?? [], topicActions);

      return {
        content: extra ? `${content}\n\nRelated: ${extra}.` : content,
        links,
        actions,
        navigateTo: primary.primaryLink,
        suggestedPrompts: suggestPromptsForContext(context),
        matchedTopic: primary.title,
        mode: "demo",
      };
    }
  }

  const fallback = buildFallback(context);
  fallback.content = `I don't have specific information about that in my current knowledge base.\n\nYou're on ${context.page.label}. Try asking about Nexar Network, NXR, marketplace, merchants, or payments — or use search (e.g. "find headphones").`;
  return fallback;
}
