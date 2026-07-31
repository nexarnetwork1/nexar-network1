export type MerchantAssistantTask =
  | "title"
  | "description"
  | "seo"
  | "keywords"
  | "tags"
  | "marketing"
  | "translation"
  | "sales"
  | "optimization";

export type MerchantAssistantRequest = {
  task: MerchantAssistantTask;
  input: string;
};

export type MerchantAssistantResponse = {
  content: string;
  mode: "demo" | "openai";
};

export interface MerchantAssistantProvider {
  generate(request: MerchantAssistantRequest): Promise<MerchantAssistantResponse>;
}

export type GlobalAssistantLink = {
  label: string;
  href: string;
};

export type GlobalAssistantAction = GlobalAssistantLink & {
  kind?: "navigate" | "prompt";
  prompt?: string;
};

export type GlobalAssistantSearchHit = {
  type: string;
  id: string;
  title: string;
  ref: string;
  snippet?: string;
};

export type ConversationTurn = {
  role: "user" | "assistant";
  content: string;
  topic?: string;
  entityRef?: string;
};

export type GlobalAssistantRequest = {
  message: string;
  pathname?: string;
  hash?: string;
  conversationHistory?: ConversationTurn[];
};

export type GlobalAssistantResponse = {
  content: string;
  links: GlobalAssistantLink[];
  actions: GlobalAssistantAction[];
  navigateTo?: string;
  suggestedPrompts: string[];
  searchResults?: GlobalAssistantSearchHit[];
  matchedTopic?: string;
  mode: "demo" | "openai";
};
