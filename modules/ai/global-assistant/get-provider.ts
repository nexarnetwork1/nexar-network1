import { getAssistantProvider } from "@/lib/ai/provider";
import type { GlobalAssistantProvider } from "./global-assistant/types";

/** Returns OpenAI provider when configured; otherwise enterprise demo provider. */
export function getGlobalAssistantProvider(): GlobalAssistantProvider {
  return getAssistantProvider();
}
