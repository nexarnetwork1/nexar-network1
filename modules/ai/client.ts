/** Client-safe AI module exports (types, prompts). Import server actions from `@/modules/ai/actions`. */
export type {
  MerchantAssistantTask,
  MerchantAssistantRequest,
  MerchantAssistantResponse,
  GlobalAssistantResponse,
  GlobalAssistantLink,
  GlobalAssistantAction,
  GlobalAssistantSearchHit,
  GlobalAssistantRequest,
  ConversationTurn,
} from "./types";
export { ASSISTANT_SUGGESTED_PROMPTS } from "./site-knowledge";
