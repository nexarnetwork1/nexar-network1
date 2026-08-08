/**
 * Optional PostHog product analytics — active only when NEXT_PUBLIC_POSTHOG_KEY is set.
 * Uses HTTP capture API; no sensitive fields should be passed.
 */

const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/$/, "") ??
  "https://us.i.posthog.com";

export function isPostHogConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

export type PostHogEventProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

function sanitizeProperties(
  properties?: PostHogEventProperties,
): Record<string, string | number | boolean> {
  if (!properties) return {};
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value === null || value === undefined) continue;
    if (
      key.toLowerCase().includes("password") ||
      key.toLowerCase().includes("token") ||
      key.toLowerCase().includes("secret")
    ) {
      continue;
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      out[key] = value;
    }
  }
  return out;
}

export async function capturePostHogEvent(input: {
  event: string;
  distinctId?: string;
  properties?: PostHogEventProperties;
}): Promise<void> {
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!apiKey) return;

  const distinctId = input.distinctId ?? "anonymous";

  try {
    await fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        event: input.event,
        distinct_id: distinctId,
        properties: {
          ...sanitizeProperties(input.properties),
          $lib: "nexar-network",
          environment: process.env.NODE_ENV,
        },
      }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    /* non-fatal */
  }
}

/** Standard product events — no PII beyond opaque user ids. */
export const ProductEvents = {
  registration: "user_registered",
  login: "user_logged_in",
  logout: "user_logged_out",
  marketplaceView: "marketplace_viewed",
  atlasOpen: "atlas_workspace_opened",
  search: "search_performed",
  profileView: "profile_viewed",
  merchantDashboard: "merchant_dashboard_opened",
  customerDashboard: "customer_dashboard_opened",
  orderCreated: "order_created",
  checkoutStarted: "checkout_started",
  walletConnect: "wallet_connected",
} as const;
