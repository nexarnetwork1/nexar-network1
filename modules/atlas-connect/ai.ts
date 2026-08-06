/**
 * ATLAS Connect — AI capability contracts.
 * Atlas AI participates inside Connect. Implementation plugs into these ports later.
 */

export type ConnectAiCapability =
  | "conversation_summary"
  | "meeting_summary"
  | "automatic_translation"
  | "suggested_replies"
  | "task_extraction"
  | "decision_extraction"
  | "generate_quotation"
  | "generate_contract"
  | "generate_invoice"
  | "recommend_next_actions";

export const CONNECT_AI_CAPABILITIES: readonly ConnectAiCapability[] = [
  "conversation_summary",
  "meeting_summary",
  "automatic_translation",
  "suggested_replies",
  "task_extraction",
  "decision_extraction",
  "generate_quotation",
  "generate_contract",
  "generate_invoice",
  "recommend_next_actions",
] as const;

export type ConnectAiRequest = {
  capability: ConnectAiCapability;
  workspaceId: string;
  conversationId?: string;
  meetingId?: string;
  messageIds?: string[];
  locale?: string;
  targetLocale?: string;
  context?: Record<string, unknown>;
};

export type ConnectAiSuggestedReply = {
  text: string;
  confidence: number;
  tone: "professional" | "friendly" | "concise";
};

export type ConnectAiExtractedTask = {
  title: string;
  assigneeHint?: string;
  dueHint?: string;
  confidence: number;
};

export type ConnectAiExtractedDecision = {
  decision: string;
  owners: string[];
  confidence: number;
};

export type ConnectAiResult = {
  capability: ConnectAiCapability;
  summary?: string;
  translatedText?: string;
  suggestedReplies?: ConnectAiSuggestedReply[];
  extractedTasks?: ConnectAiExtractedTask[];
  extractedDecisions?: ConnectAiExtractedDecision[];
  generatedDocument?: {
    documentType: "quotation" | "contract" | "invoice";
    title: string;
    bodyMarkdown: string;
  };
  nextActions?: Array<{ action: string; reason: string; priority: number }>;
  metadata: Record<string, unknown>;
};

/**
 * Pure stub — returns structured empty results.
 * Real LLM / Atlas AI service wires behind this contract later.
 */
export function createConnectAiStubResult(
  request: ConnectAiRequest,
): ConnectAiResult {
  return {
    capability: request.capability,
    metadata: {
      status: "not_implemented",
      workspaceId: request.workspaceId,
      conversationId: request.conversationId ?? null,
    },
  };
}

/** Heuristic next-action recommendations from message type (no LLM). */
export function recommendNextActionsFromMessage(input: {
  messageType: string;
  body?: string | null;
}): Array<{ action: string; reason: string; priority: number }> {
  const actions: Array<{ action: string; reason: string; priority: number }> = [];

  if (input.messageType === "quotation") {
    actions.push({
      action: "Convert to order",
      reason: "Quotation shared in conversation",
      priority: 1,
    });
    actions.push({
      action: "Schedule follow-up meeting",
      reason: "Close commercial loop",
      priority: 2,
    });
  }
  if (input.messageType === "invoice") {
    actions.push({
      action: "Request payment",
      reason: "Invoice shared",
      priority: 1,
    });
  }
  if (input.messageType === "text" && input.body) {
    if (/\b(meeting|call|schedule)\b/i.test(input.body)) {
      actions.push({
        action: "Schedule meeting",
        reason: "Message mentions scheduling",
        priority: 1,
      });
    }
    if (/\b(todo|follow up|action)\b/i.test(input.body)) {
      actions.push({
        action: "Create task",
        reason: "Action language detected",
        priority: 1,
      });
    }
  }
  return actions;
}
