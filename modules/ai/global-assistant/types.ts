import type { GlobalAssistantLink } from "../types";

export type AssistantUserRole = "guest" | "customer" | "merchant" | "admin" | "treasury_admin";

export type AssistantPageType =
  | "home"
  | "marketplace"
  | "product"
  | "shop"
  | "cart"
  | "checkout"
  | "wishlist"
  | "merchant"
  | "customer"
  | "admin"
  | "whitepaper"
  | "about"
  | "legal"
  | "market"
  | "pay"
  | "contact"
  | "other";

export type AssistantPageContext = {
  pageType: AssistantPageType;
  label: string;
  entityId?: string;
  entitySlug?: string;
  entityName?: string;
  entityDescription?: string;
  entityMeta?: Record<string, string>;
  sectionId?: string;
};

export type ConversationTurn = {
  role: "user" | "assistant";
  content: string;
  topic?: string;
  entityRef?: string;
};

export type AssistantSearchHit = {
  type: string;
  id: string;
  title: string;
  ref: string;
  snippet?: string;
};

export type AssistantAction = GlobalAssistantLink & {
  kind?: "navigate" | "prompt";
  prompt?: string;
};

export type GlobalAssistantRequestContext = {
  pathname?: string;
  hash?: string;
  conversationHistory?: ConversationTurn[];
};

export type EnrichedAssistantContext = {
  pathname: string;
  hash?: string;
  userRole: AssistantUserRole;
  page: AssistantPageContext;
  conversationHistory: ConversationTurn[];
  lastTopic?: string;
  lastEntity?: { type: string; name: string; id?: string; slug?: string };
};

export type GlobalAssistantResult = {
  content: string;
  links: GlobalAssistantLink[];
  actions: AssistantAction[];
  navigateTo?: string;
  suggestedPrompts: string[];
  searchResults?: AssistantSearchHit[];
  matchedTopic?: string;
  mode: "demo" | "openai";
};

export interface GlobalAssistantProvider {
  respond(
    message: string,
    context: EnrichedAssistantContext,
  ): Promise<GlobalAssistantResult>;
}
