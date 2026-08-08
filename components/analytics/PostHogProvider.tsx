"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST?.replace(/\/$/, "") ??
  "https://us.i.posthog.com";

/**
 * Lightweight PostHog pageview tracking — only when key is configured
 * and analytics consent is granted (CookieConsent sets nxr_analytics=1).
 */
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!POSTHOG_KEY) return;
    if (typeof window === "undefined") return;

    const consent = document.cookie.includes("nxr_analytics=1");
    if (!consent) return;

    void fetch(`${POSTHOG_HOST}/capture/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: POSTHOG_KEY,
        event: "$pageview",
        distinct_id: "anonymous",
        properties: {
          $current_url: window.location.href,
          path: pathname,
          $lib: "nexar-network",
        },
      }),
    }).catch(() => undefined);
  }, [pathname]);

  return children;
}
