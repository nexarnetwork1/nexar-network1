"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { isOAuthProviderEnabled } from "@/lib/auth/oauth-providers";

type OAuthButtonsProps = {
  redirectTo?: string;
  intent?: "customer" | "merchant";
};

const PROVIDERS = [
  { id: "google" as const, label: "Continue with Google" },
  { id: "apple" as const, label: "Continue with Apple" },
];

function OAuthProviderButton({
  provider,
  label,
  redirectTo,
  intent,
}: {
  provider: "google" | "apple";
  label: string;
  redirectTo?: string;
  intent?: "customer" | "merchant";
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enabled = isOAuthProviderEnabled(provider);

  async function signIn() {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (redirectTo) params.set("redirect", redirectTo);
    if (intent) params.set("intent", intent);

    const query = params.toString();
    const suffix = query.length > 0 ? "?" + query : "";
    const callbackUrl = window.location.origin + "/auth/callback" + suffix;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        className="w-full justify-between"
        disabled={!enabled || loading}
        onClick={signIn}
      >
        <span>{loading ? "Redirecting..." : label}</span>
        {!enabled && (
          <span className="text-[10px] font-normal uppercase tracking-wide text-muted">
            Coming Soon
          </span>
        )}
      </Button>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      {!enabled && (
        <p className="mt-1 text-[10px] text-muted">Provider not configured.</p>
      )}
    </div>
  );
}

export function OAuthButtons({ redirectTo, intent }: OAuthButtonsProps) {
  return (
    <div className="space-y-2.5">
      {PROVIDERS.map((provider) => (
        <OAuthProviderButton
          key={provider.id}
          provider={provider.id}
          label={provider.label}
          redirectTo={redirectTo}
          intent={intent}
        />
      ))}
    </div>
  );
}
