import { runPlatformSearch, formatSearchResultsForModel } from "./search";
import { resolveNavigationHref, buildSuggestedActions } from "./navigation";
import type { EnrichedAssistantContext } from "@/modules/ai/global-assistant/types";

export type AssistantToolName = "search_platform" | "suggest_navigation";

export type AssistantToolCall = {
  name: AssistantToolName;
  arguments: Record<string, string>;
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
        query: {
          type: "string",
          description: "Search query",
        },
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
      "Resolve a navigation target to an internal platform route (marketplace, cart, merchant dashboard, whitepaper, etc.).",
    parameters: {
      type: "object",
      properties: {
        target: {
          type: "string",
          description: "Navigation target such as marketplace, cart, merchant dashboard, whitepaper",
        },
      },
      required: ["target"],
      additionalProperties: false,
    },
    strict: true,
  },
];

export async function executeAssistantTool(
  call: AssistantToolCall,
  context: EnrichedAssistantContext,
): Promise<string> {
  switch (call.name) {
    case "search_platform": {
      const query = call.arguments.query?.trim() ?? "";
      const hits = await runPlatformSearch(query, 6);
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
    default:
      return "Unknown tool.";
  }
}

export function parseToolCall(
  name: string,
  argsJson: string,
): AssistantToolCall | null {
  try {
    const args = JSON.parse(argsJson) as Record<string, string>;
    if (name === "search_platform" || name === "suggest_navigation") {
      return { name, arguments: args };
    }
  } catch {
    // invalid JSON
  }
  return null;
}
