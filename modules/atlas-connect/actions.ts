/**
 * ATLAS Connect — smart business actions.
 * Pure functions mapping messages → actionable business entities.
 */

import type { ConnectActionType, ConnectMessageType } from "./types";

export type MessageActionCandidate = {
  messageType: ConnectMessageType;
  body: string | null;
  payload: Record<string, unknown>;
};

export type SuggestedAction = {
  actionType: ConnectActionType;
  label: string;
  confidence: number;
  reason: string;
};

/** Message types that can convert to business actions. */
const CONVERTIBLE_TYPES: Partial<Record<ConnectMessageType, ConnectActionType[]>> = {
  text: ["task", "lead", "customer", "business_note", "crm_opportunity"],
  task: ["task"],
  quotation: ["order", "invoice", "crm_opportunity"],
  invoice: ["invoice"],
  purchase_order: ["order"],
  payment_link: ["invoice"],
  product: ["order", "crm_opportunity"],
  service: ["order", "crm_opportunity"],
  calendar_event: ["calendar_event"],
  ai_response: ["task", "business_note"],
};

const ACTION_LABELS: Record<ConnectActionType, string> = {
  task: "Create Task",
  lead: "Create Lead",
  customer: "Add Customer",
  supplier: "Add Supplier",
  employee: "Add Employee",
  order: "Create Order",
  invoice: "Generate Invoice",
  calendar_event: "Schedule Event",
  crm_opportunity: "Create Opportunity",
  business_note: "Save as Note",
};

/** Suggest convertible actions for a message. */
export function suggestMessageActions(
  input: MessageActionCandidate,
): SuggestedAction[] {
  const types = CONVERTIBLE_TYPES[input.messageType] ?? [];
  const suggestions: SuggestedAction[] = [];

  for (const actionType of types) {
    let confidence = 0.6;
    let reason = `Message type "${input.messageType}" supports ${actionType}`;

    if (input.messageType === "text" && input.body) {
      const lower = input.body.toLowerCase();
      if (actionType === "task" && /\b(todo|task|action item|follow up)\b/.test(lower)) {
        confidence = 0.9;
        reason = "Text contains task keywords";
      }
      if (actionType === "lead" && /\b(lead|prospect|inquiry|interested)\b/.test(lower)) {
        confidence = 0.85;
        reason = "Text contains lead keywords";
      }
      if (actionType === "invoice" && /\b(invoice|bill|payment due)\b/.test(lower)) {
        confidence = 0.88;
        reason = "Text contains invoice keywords";
      }
    }

    suggestions.push({
      actionType,
      label: ACTION_LABELS[actionType],
      confidence,
      reason,
    });
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence);
}

/** Whether a message type directly maps to a single primary action. */
export function primaryActionForMessageType(
  messageType: ConnectMessageType,
): ConnectActionType | null {
  const direct: Partial<Record<ConnectMessageType, ConnectActionType>> = {
    quotation: "crm_opportunity",
    invoice: "invoice",
    purchase_order: "order",
    payment_link: "invoice",
    calendar_event: "calendar_event",
    task: "task",
  };
  return direct[messageType] ?? null;
}
