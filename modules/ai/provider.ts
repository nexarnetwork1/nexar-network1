import type { MerchantAssistantProvider } from "./types";
import { isOpenAIConfigured } from "@/lib/ai/config";
import { demoMerchantAssistantProvider } from "./demo-provider";

/** Returns OpenAI provider when configured; otherwise demo mode. */
export function getMerchantAssistantProvider(): MerchantAssistantProvider {
  if (isOpenAIConfigured()) {
    // Merchant OpenAI integration can be swapped in here without changing UI callers.
    return demoMerchantAssistantProvider;
  }
  return demoMerchantAssistantProvider;
}
