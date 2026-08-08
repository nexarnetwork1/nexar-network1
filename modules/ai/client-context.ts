/**
 * Client-safe route/page context for ATLAS AI.
 * Parses public URL state only — no auth, DB, or server enrichment.
 */
export { parseRouteContext } from "./global-assistant/context";

export type {
  AssistantPageContext,
  AssistantPageType,
} from "./global-assistant/types";
