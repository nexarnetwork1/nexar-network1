import OpenAI from "openai";
import type { ResponseStreamEvent } from "openai/resources/responses/responses";
import { getOpenAIApiKey, getOpenAIModelName, isOpenAIConfigured } from "./config";
import { ASSISTANT_TOOLS, executeAssistantTool, parseToolCall } from "./tools";
import { buildAssistantInstructions, buildSuggestedPromptsForContext } from "./prompts";
import { assembleKnowledgeContext } from "./knowledge";
import { formatConversationInput, extractTopicFromContent } from "./context";
import { buildSuggestedActions, detectNavigationIntent } from "./navigation";
import type { EnrichedAssistantContext } from "@/modules/ai/global-assistant/types";
import type { GlobalAssistantResult } from "@/modules/ai/global-assistant/types";

const MAX_TOOL_ROUNDS = 3;

export { isOpenAIConfigured };

export function getOpenAIModel(): string {
  const model = getOpenAIModelName();
  if (!model) {
    throw new Error("OPENAI_MODEL is not configured");
  }
  return model;
}

export function createOpenAIClient(): OpenAI {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey });
}

type ResponseInput = OpenAI.Responses.ResponseInput;

function buildInputMessages(
  message: string,
  context: EnrichedAssistantContext,
): ResponseInput {
  const conversation = formatConversationInput(message, context);
  return conversation.map((turn) => ({
    role: turn.role,
    content: turn.content,
  }));
}

async function runWithTools(
  client: OpenAI,
  instructions: string,
  input: ResponseInput,
  context: EnrichedAssistantContext,
  signal?: AbortSignal,
): Promise<{ text: string; navigateTo?: string }> {
  let currentInput: ResponseInput = input;
  let finalText = "";
  let navigateTo: string | undefined;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const response = await client.responses.create(
      {
        model: getOpenAIModel(),
        instructions,
        input: currentInput,
        tools: ASSISTANT_TOOLS,
        max_output_tokens: 800,
        temperature: 0.3,
      },
      { signal },
    );

    finalText = response.output_text?.trim() ?? "";
    const toolCalls = response.output.filter((item) => item.type === "function_call");

    if (!toolCalls.length) break;

    const toolOutputs: ResponseInput = [];

    for (const call of toolCalls) {
      if (call.type !== "function_call") continue;
      const parsed = parseToolCall(call.name, call.arguments);
      if (!parsed) continue;

      const output = await executeAssistantTool(parsed, context);
      if (parsed.name === "suggest_navigation") {
        const hrefMatch = output.match(/Navigate to: (\S+)/);
        if (hrefMatch?.[1]) navigateTo = hrefMatch[1];
      }

      toolOutputs.push({
        type: "function_call_output",
        call_id: call.call_id,
        output,
      });
    }

    currentInput = [...currentInput, ...response.output, ...toolOutputs];
  }

  return { text: finalText, navigateTo };
}

function enrichResult(
  text: string,
  context: EnrichedAssistantContext,
  message: string,
  navigateTo?: string,
): GlobalAssistantResult {
  const topic = extractTopicFromContent(text) ?? extractTopicFromContent(message);
  const navHref = navigateTo ?? detectNavigationIntent(message);
  const actions = buildSuggestedActions(context.userRole, {
    topic,
    pageType: context.page.pageType,
    content: text,
  });

  const links = actions.slice(0, 3).map(({ label, href }) => ({ label, href }));

  return {
    content: text || "I couldn't generate a response. Please try again.",
    links,
    actions,
    navigateTo: navHref ?? undefined,
    suggestedPrompts: [],
    matchedTopic: topic,
    mode: "openai",
  };
}

/** Non-streaming OpenAI response via Responses API. */
export async function createAssistantResponse(
  message: string,
  context: EnrichedAssistantContext,
  signal?: AbortSignal,
): Promise<GlobalAssistantResult> {
  const client = createOpenAIClient();
  const knowledge = await assembleKnowledgeContext(context, message);
  const instructions = buildAssistantInstructions(context, knowledge);
  const input = buildInputMessages(message, context);

  const { text, navigateTo } = await runWithTools(client, instructions, input, context, signal);
  const result = enrichResult(text, context, message, navigateTo);
  result.suggestedPrompts = buildSuggestedPromptsForContext(context);
  return result;
}

export type StreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; result: GlobalAssistantResult }
  | { type: "error"; message: string };

/** Streaming OpenAI response — yields text deltas then final enriched result. */
export async function* streamAssistantResponse(
  message: string,
  context: EnrichedAssistantContext,
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const client = createOpenAIClient();
  const knowledge = await assembleKnowledgeContext(context, message);
  const instructions = buildAssistantInstructions(context, knowledge);
  const input = buildInputMessages(message, context);

  let accumulated = "";

  try {
    const stream = await client.responses.create(
      {
        model: getOpenAIModel(),
        instructions,
        input,
        max_output_tokens: 800,
        temperature: 0.3,
        stream: true,
      },
      { signal },
    );

    for await (const event of stream as AsyncIterable<ResponseStreamEvent>) {
      if (signal?.aborted) break;

      if (event.type === "response.output_text.delta") {
        accumulated += event.delta;
        yield { type: "delta", text: event.delta };
      }

      if (event.type === "response.completed") {
        const text = accumulated.trim() || event.response.output_text?.trim() || "";
        const result = enrichResult(text, context, message);
        result.suggestedPrompts = buildSuggestedPromptsForContext(context);
        yield { type: "done", result };
        return;
      }
    }

    if (accumulated.trim()) {
      const result = enrichResult(accumulated.trim(), context, message);
      result.suggestedPrompts = buildSuggestedPromptsForContext(context);
      yield { type: "done", result };
    }
  } catch (error) {
    if (signal?.aborted) return;
    const msg = error instanceof Error ? error.message : "Stream failed";
    yield { type: "error", message: msg };
  }
}
