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
export { inferLoadingMessage } from "./client-ui";
export { parseRouteContext } from "./client-context";
export type { AssistantPageContext, AssistantPageType } from "./client-context";
