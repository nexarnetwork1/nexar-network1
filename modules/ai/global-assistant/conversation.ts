import type { ConversationTurn, EnrichedAssistantContext } from "./types";

const PRONOUN_PATTERNS =
  /\b(it|this|that|here|this page|this product|this section|the product|the page)\b/i;

const FOLLOWUP_PATTERNS =
  /^(how do i|where|what about|tell me more|and|also|why|when|who|can i|should i)/i;

export function isContextualQuery(query: string): boolean {
  return PRONOUN_PATTERNS.test(query) || FOLLOWUP_PATTERNS.test(query.trim());
}

export function resolveContextualQuery(
  query: string,
  context: EnrichedAssistantContext,
): { rewritten: string; usedContext: boolean } {
  const trimmed = query.trim();
  let rewritten = trimmed;
  let usedContext = false;

  if (PRONOUN_PATTERNS.test(trimmed)) {
    if (context.page.pageType === "product" && context.page.entityName) {
      rewritten = trimmed.replace(PRONOUN_PATTERNS, context.page.entityName);
      usedContext = true;
    } else if (context.lastEntity?.name) {
      rewritten = trimmed.replace(PRONOUN_PATTERNS, context.lastEntity.name);
      usedContext = true;
    } else if (context.lastTopic) {
      rewritten = `${trimmed} (about ${context.lastTopic})`;
      usedContext = true;
    } else {
      rewritten = `${trimmed} on ${context.page.label}`;
      usedContext = true;
    }
  }

  if (FOLLOWUP_PATTERNS.test(trimmed) && context.lastTopic && !usedContext) {
    rewritten = `${trimmed} regarding ${context.lastTopic}`;
    usedContext = true;
  }

  return { rewritten, usedContext };
}

export function getLastTopic(history: ConversationTurn[]): string | undefined {
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].role === "assistant" && history[i].topic) {
      return history[i].topic;
    }
  }
  return undefined;
}

export function buildEntityRef(context: EnrichedAssistantContext): string | undefined {
  if (context.page.entityName && context.page.pageType === "product") {
    return `product::${context.page.entityName}`;
  }
  if (context.page.entityName && context.page.pageType === "merchant") {
    return `store::${context.page.entityName}`;
  }
  return undefined;
}
