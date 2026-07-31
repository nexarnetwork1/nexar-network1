import { headers } from "next/headers";
import { rateLimit } from "@/lib/security/rate-limit";

/** Per-IP assistant rate limit — 30 requests per minute. */
export async function checkAssistantRateLimit(): Promise<{ allowed: boolean }> {
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerStore.get("x-real-ip") ??
    "unknown";

  const { allowed } = rateLimit(`assistant:${ip}`, "assistant");
  return { allowed };
}
