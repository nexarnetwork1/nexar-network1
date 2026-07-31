import { demoGlobalAssistantProvider } from "@/modules/ai/global-assistant/provider";
import type {
  EnrichedAssistantContext,
  GlobalAssistantProvider,
  GlobalAssistantResult,
} from "@/modules/ai/global-assistant/types";
import {
  createAssistantResponse,
  streamAssistantResponse,
  type StreamEvent,
} from "./openai";
import { isOpenAIConfigured } from "./config";

/** OpenAI-backed assistant with automatic fallback to the local demo engine. */
export class OpenAIGlobalAssistantProvider implements GlobalAssistantProvider {
  async respond(
    message: string,
    context: EnrichedAssistantContext,
  ): Promise<GlobalAssistantResult> {
    if (!isOpenAIConfigured()) {
      return demoGlobalAssistantProvider.respond(message, context);
    }

    try {
      return await createAssistantResponse(message, context);
    } catch {
      const fallback = await demoGlobalAssistantProvider.respond(message, context);
      return {
        ...fallback,
        content: `${fallback.content}\n\n_Note: AI service temporarily unavailable — showing cached guidance._`,
        mode: "demo",
      };
    }
  }

  stream(
    message: string,
    context: EnrichedAssistantContext,
    signal?: AbortSignal,
  ): AsyncGenerator<StreamEvent> {
    if (!isOpenAIConfigured()) {
      return demoStream(message, context);
    }
    return streamAssistantResponse(message, context, signal);
  }
}

async function* demoStream(
  message: string,
  context: EnrichedAssistantContext,
): AsyncGenerator<StreamEvent> {
  const result = await demoGlobalAssistantProvider.respond(message, context);
  yield { type: "delta", text: result.content };
  yield { type: "done", result };
}

let openaiProvider: OpenAIGlobalAssistantProvider | null = null;

export function getAssistantProvider(): GlobalAssistantProvider {
  if (!openaiProvider) {
    openaiProvider = new OpenAIGlobalAssistantProvider();
  }
  return openaiProvider;
}

export { isOpenAIConfigured } from "./config";
export { streamAssistantResponse, type StreamEvent };
