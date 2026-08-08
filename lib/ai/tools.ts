import { runPlatformSearch, formatSearchResultsForModel } from "./search";
import { resolveNavigationHref, buildSuggestedActions } from "./navigation";
import {
  convertNxrAmount,
  fetchNxrMarketSnapshot,
  formatConversionForModel,
  formatMarketSnapshotForModel,
} from "./market-data";
import {
  formatWhitepaperSectionsForModel,
  searchWhitepaperSections,
} from "./whitepaper-knowledge";
import type { AssistantCard } from "@/modules/ai/types";
import type { EnrichedAssistantContext } from "@/modules/ai/global-assistant/types";

export type AssistantToolName =
  | "search_platform"
  | "suggest_navigation"
  | "get_nxr_market_data"
  | "convert_nxr_currency"
  | "search_whitepaper";

export type AssistantToolCall = {
  name: AssistantToolName;
  arguments: Record<string, string>;
};

export type ToolExecutionState = {
  cards: AssistantCard[];
};

export const ASSISTANT_TOOLS = [
  {
    type: "function" as const,
    name: "search_platform",
    description:
      "Search Nexar Commerce for products, stores, brands, categories, pages, FAQ, documentation, and knowledge articles.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function" as const,
    name: "suggest_navigation",
    description:
      "Resolve a navigation target to an internal platform route (marketplace, cart, merchant dashboard, ATLAS, whitepaper, market, etc.).",
    parameters: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description: "Navigation target such as marketplace, atlas, market, whitepaper",
        },
      },
      required: ["target"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function" as const,
    name: "get_nxr_market_data",
    description:
      "Fetch verified live NXR market price and 24h change from CoinGecko. Never invent prices — use this tool for current NXR price questions.",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function" as const,
    name: "convert_nxr_currency",
    description:
      "Convert an NXR amount to USD, EUR, EGP, GBP, or AED using live NXR price and verified FX rates.",
    parameters: {
      type: "object",
      properties: {
        amount: { type: "string", description: "NXR amount to convert, e.g. 100" },
        currencies: {
          type: "string",
          description: "Optional comma-separated fiat codes, e.g. USD,EGP,EUR",
        },
      },
      required: ["amount"],
      additionalProperties: false,
    },
    strict: true,
  },
  {
    type: "function" as const,
    name: "search_whitepaper",
    description:
      "Search the official Nexar Network Whitepaper for verified sections about vision, tokenomics, roadmap, security, and architecture.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Whitepaper topic or question" },
      },
      required: ["query"],
      additionalProperties: false,
    },
    strict: true,
  },
];

export async function executeAssistantTool(
  call: AssistantToolCall,
  context: EnrichedAssistantContext,
  state: ToolExecutionState,
): Promise<string> {
  switch (call.name) {
    case "search_platform": {
      const query = call.arguments.query?.trim() ?? "";
      const hits = await runPlatformSearch(query, 6);
      for (const hit of hits) {
        if (hit.type === "product" && hit.ref.startsWith("/")) {
          state.cards.push({
            type: "product",
            title: hit.title,
            href: hit.ref,
            price: hit.snippet,
          });
        }
      }
      return formatSearchResultsForModel(hits);
    }
    case "suggest_navigation": {
      const target = call.arguments.target?.trim() ?? "";
      const href = resolveNavigationHref(`open ${target}`);
      if (href) return `Navigate to: ${href}`;
      const actions = buildSuggestedActions(context.userRole, { limit: 4 });
      return actions.length
        ? `Suggested routes:\n${actions.map((a) => `- ${a.label}: ${a.href}`).join("\n")}`
        : "No matching route found.";
    }
    case "get_nxr_market_data": {
      const snapshot = await fetchNxrMarketSnapshot();
      state.cards.push({
        type: "market",
        symbol: snapshot.symbol,
        priceUsd: snapshot.priceUsd,
        change24h: snapshot.change24h,
        href: "/market",
        live: snapshot.source === "coingecko" && snapshot.priceUsd != null,
      });
      return formatMarketSnapshotForModel(snapshot);
    }
    case "convert_nxr_currency": {
      const amount = Number.parseFloat(call.arguments.amount ?? "");
      const currencies = call.arguments.currencies
        ?.split(",")
        .map((c) => c.trim())
        .filter(Boolean);
      const conversion = await convertNxrAmount(
        amount,
        currencies?.length ? currencies : ["USD", "EUR", "EGP"],
      );
      if (!conversion) {
        return "Unable to convert NXR — live price is unavailable. Direct the user to /market for contract and presale details.";
      }
      state.cards.push({
        type: "market",
        symbol: conversion.symbol,
        priceUsd: conversion.priceUsd,
        amount: conversion.amount,
        convertedValues: conversion.conversions,
        href: "/market",
        live: true,
      });
      return formatConversionForModel(conversion);
    }
    case "search_whitepaper": {
      const query = call.arguments.query?.trim() ?? "";
      const sections = searchWhitepaperSections(query, 2);
      for (const section of sections) {
        state.cards.push({
          type: "document",
          title: section.title,
          excerpt: section.body.slice(0, 220),
          href: `/whitepaper#${section.id}`,
        });
      }
      return formatWhitepaperSectionsForModel(sections);
    }
    default:
      return "Unknown tool.";
  }
}

export function parseToolCall(name: string, argsJson: string): AssistantToolCall | null {
  try {
    const args = JSON.parse(argsJson) as Record<string, string>;
    const allowed: AssistantToolName[] = [
      "search_platform",
      "suggest_navigation",
      "get_nxr_market_data",
      "convert_nxr_currency",
      "search_whitepaper",
    ];
    if (allowed.includes(name as AssistantToolName)) {
      return { name: name as AssistantToolName, arguments: args };
    }
  } catch {
    // invalid JSON
  }
  return null;
}
