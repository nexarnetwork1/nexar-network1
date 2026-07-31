import type { ConversationTurn } from "@/modules/ai/types";
import type { EnrichedAssistantContext } from "@/modules/ai/global-assistant/types";
import { getContextSummary } from "@/modules/ai/global-assistant/enrich-context";
import { resolveContextualQuery } from "@/modules/ai/global-assistant/conversation";

export type OpenAIMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string };

/** Format session history for OpenAI Responses API input. */
export function formatConversationInput(
  message: string,
  context: EnrichedAssistantContext,
): OpenAIMessage[] {
  const { rewritten } = resolveContextualQuery(message, context);
  const messages: OpenAIMessage[] = [];

  for (const turn of context.conversationHistory.slice(-10)) {
    messages.push({
      role: turn.role,
      content: turn.content.slice(0, 2000),
    });
  }

  messages.push({ role: "user", content: rewritten });
  return messages;
}

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

export function extractTopicFromContent(content: string): string | undefined {
  const nxr = /\bNXR\b/i.test(content) ? "NXR" : undefined;
  if (nxr) return nxr;
  if (/marketplace|commerce|shop/i.test(content)) return "Marketplace";
  if (/merchant|sell|store/i.test(content)) return "Merchant";
  if (/whitepaper|tokenomics/i.test(content)) return "Whitepaper";
  return undefined;
}

export function toConversationTurns(messages: OpenAIMessage[]): ConversationTurn[] {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}
