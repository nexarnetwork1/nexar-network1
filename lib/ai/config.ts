import { env } from "@/config/env";

/** Server-side OpenAI API key — never expose to the client. */
export function getOpenAIApiKey(): string | undefined {
  const key = env.OPENAI_API_KEY?.trim();
  return key || undefined;
}

/** OpenAI model identifier from OPENAI_MODEL. */
export function getOpenAIModelName(): string | undefined {
  const model = env.OPENAI_MODEL?.trim();
  return model || undefined;
}

/** OpenAI is ready only when both OPENAI_API_KEY and OPENAI_MODEL are set. */
export function isOpenAIConfigured(): boolean {
  return Boolean(getOpenAIApiKey() && getOpenAIModelName());
}
