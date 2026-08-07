import "server-only";

import {
  createOpenAIClient,
  getOpenAIModel,
  isOpenAIConfigured,
} from "@/lib/ai/openai";
import type { AiAssistAction } from "./prompts-contextual";
import { buildAssistPrompt } from "./prompts-contextual";

export type CompletionMode = "openai" | "demo";

function demoCompletion(action: AiAssistAction, text: string): string {
  const snippet = text.trim().slice(0, 120) || "your content";
  return `[ATLAS AI · demo] ${action.replace(/_/g, " ")} applied to: "${snippet}"\n\nConnect OPENAI_API_KEY and OPENAI_MODEL for live generation.`;
}

export async function generateAssistCompletion(input: {
  action: AiAssistAction;
  text: string;
  context?: Record<string, unknown>;
}): Promise<{ content: string; mode: CompletionMode }> {
  const { system, user } = buildAssistPrompt(input);

  if (!isOpenAIConfigured()) {
    return { content: demoCompletion(input.action, input.text), mode: "demo" };
  }

  try {
    const client = createOpenAIClient();
    const response = await client.responses.create({
      model: getOpenAIModel(),
      instructions: system,
      input: [{ role: "user", content: user }],
      max_output_tokens: 1200,
      temperature: 0.35,
    });
    const content = response.output_text?.trim();
    if (!content) {
      return { content: demoCompletion(input.action, input.text), mode: "demo" };
    }
    return { content, mode: "openai" };
  } catch {
    return { content: demoCompletion(input.action, input.text), mode: "demo" };
  }
}
