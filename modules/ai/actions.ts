"use server";

import { z } from "zod";
import type { ActionResult } from "@/modules/auth/actions";
import { sanitizeUserMessage, isEmptyAfterSanitize } from "@/lib/ai/memory";
import { checkAssistantRateLimit } from "@/lib/ai/rate-limit";
import { enrichAssistantContext } from "./global-assistant/enrich-context";
import { getGlobalAssistantProvider } from "./global-assistant/get-provider";
import { demoGlobalAssistantProvider } from "./global-assistant/provider";
import { getMerchantAssistantProvider } from "./provider";
import type {
  GlobalAssistantRequest,
  GlobalAssistantResponse,
  MerchantAssistantTask,
} from "./types";

const requestSchema = z.object({
  task: z.enum([
    "title",
    "description",
    "seo",
    "keywords",
    "tags",
    "marketing",
    "translation",
    "sales",
    "optimization",
  ]),
  input: z.string().max(2000),
});

const conversationTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(2000),
  topic: z.string().max(120).optional(),
  entityRef: z.string().max(200).optional(),
});

const globalRequestSchema = z.object({
  message: z.string().min(1).max(1000),
  pathname: z.string().max(200).optional(),
  hash: z.string().max(100).optional(),
  conversationHistory: z.array(conversationTurnSchema).max(12).optional(),
});

const emptyResponse = (): ActionResult & GlobalAssistantResponse => ({
  success: false,
  error: "Invalid request",
  content: "",
  links: [],
  actions: [],
  suggestedPrompts: [],
  mode: "demo",
});

export async function askGlobalAssistantAction(
  request: GlobalAssistantRequest,
): Promise<ActionResult & GlobalAssistantResponse> {
  const parsed = globalRequestSchema.safeParse(request);
  if (!parsed.success) {
    return {
      ...emptyResponse(),
      error: parsed.error.issues[0]?.message ?? "Invalid request",
    };
  }

  const sanitized = sanitizeUserMessage(parsed.data.message);
  if (isEmptyAfterSanitize(sanitized)) {
    return {
      ...emptyResponse(),
      error: "Message contains invalid content",
    };
  }

  const { allowed } = await checkAssistantRateLimit();
  if (!allowed) {
    return {
      ...emptyResponse(),
      error: "Too many requests. Please wait a moment and try again.",
    };
  }

  try {
    const context = await enrichAssistantContext({
      pathname: parsed.data.pathname,
      hash: parsed.data.hash,
      conversationHistory: parsed.data.conversationHistory,
    });

    const provider = getGlobalAssistantProvider();

    try {
      const result = await provider.respond(sanitized, context);
      return {
        success: true,
        ...result,
        actions: result.actions ?? [],
      };
    } catch {
      const fallback = await demoGlobalAssistantProvider.respond(sanitized, context);
      return {
        success: true,
        ...fallback,
        content: `${fallback.content}\n\n_Note: AI service temporarily unavailable — showing cached guidance._`,
        actions: fallback.actions ?? [],
        mode: "demo",
      };
    }
  } catch {
    return {
      ...emptyResponse(),
      error: "Nexar Assistant is temporarily unavailable. Please try again.",
    };
  }
}

export async function generateMerchantAssistantAction(
  task: MerchantAssistantTask,
  input: string,
): Promise<ActionResult & { content?: string; mode?: "demo" | "openai" }> {
  const parsed = requestSchema.safeParse({ task, input });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" };
  }

  try {
    const provider = getMerchantAssistantProvider();
    const result = await provider.generate(parsed.data);
    return {
      success: true,
      content: result.content,
      mode: result.mode,
    };
  } catch {
    return {
      success: false,
      error: "Assistant is temporarily unavailable. Please try again.",
    };
  }
}
