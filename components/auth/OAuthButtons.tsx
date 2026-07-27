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

    const callbackUrl = `${window.location.origin}/auth/callback${params.toString() ? `?${params}` : ""}`;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: callbackUrl },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  if (!enabled) {
    return (
      <Button type="button" variant="secondary" className="w-full" disabled>
        {label}
        <span className="ml-2 text-xs text-muted">(Provider not configured.)</span>
      </Button>
    );
  }

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled={loading}
        onClick={signIn}
      >
        {loading ? "Redirecting…" : label}
      </Button>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function OAuthButtons({ redirectTo, intent }: OAuthButtonsProps) {
  const anyEnabled = PROVIDERS.some((p) => isOAuthProviderEnabled(p.id));

  if (!anyEnabled) {
    return (
      <p className="rounded-xl border border-border/60 bg-surface/40 px-3 py-2 text-center text-xs text-muted">
        Social sign-in providers are not configured.
      </p>
    );
  }

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
