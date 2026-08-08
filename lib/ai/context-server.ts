import "server-only";

import type { EnrichedAssistantContext } from "@/modules/ai/global-assistant/types";
import { getContextSummary } from "@/modules/ai/global-assistant/enrich-context";

/** Server-only memory summary for OpenAI instructions. */
export function buildMemorySummary(context: EnrichedAssistantContext): string {
  const parts: string[] = [getContextSummary(context)];

  if (context.lastTopic) {
    parts.push(`Last discussed topic: ${context.lastTopic}`);
  }
  if (context.lastEntity) {
    parts.push(`Last entity: ${context.lastEntity.type} — ${context.lastEntity.name}`);
  }

  return parts.join("\n");
}
