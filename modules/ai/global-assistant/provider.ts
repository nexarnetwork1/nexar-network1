import { resolveGlobalAssistantQuery } from "./resolver";
import type { EnrichedAssistantContext, GlobalAssistantProvider, GlobalAssistantResult } from "./types";

/** Demo / rule-based global assistant — swap for OpenAI provider when ready. */
export class DemoGlobalAssistantProvider implements GlobalAssistantProvider {
  async respond(message: string, context: EnrichedAssistantContext): Promise<GlobalAssistantResult> {
    return resolveGlobalAssistantQuery(message, context);
  }
}

export const demoGlobalAssistantProvider = new DemoGlobalAssistantProvider();
