"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { isWeb3Configured } from "@/components/providers/Web3Provider";

type MarketplaceAuthButtonsProps = {
  redirectTo?: string;
  intent?: "customer" | "merchant";
};

function GoogleAuthButton({
  redirectTo,
  intent,
}: {
  redirectTo?: string;
  intent?: "customer" | "merchant";
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (redirectTo) params.set("redirect", redirectTo);
    if (intent) params.set("intent", intent);

    const query = params.toString();
    const suffix = query.length > 0 ? "?" + query : "";
    const callbackUrl = window.location.origin + "/auth/callback" + suffix;

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
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
        className="w-full"
        disabled={loading}
        onClick={signInWithGoogle}
      >
        {loading ? "Redirecting…" : "Continue with Google"}
      </Button>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

function WalletAuthButton() {
  const { login, ready, authenticated } = usePrivy();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithWallet() {
    if (!isWeb3Configured()) {
      setError("Wallet provider is not configured.");
      return;
    }
    if (!ready || connecting || authenticated) return;

    setConnecting(true);
    setError(null);
    try {
      await login();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection failed");
    } finally {
      setConnecting(false);
    }
  }

  const label = authenticated
    ? "Wallet connected"
    : connecting
      ? "Connecting…"
      : "Continue with Wallet";

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        className="w-full justify-center gap-2"
        disabled={!isWeb3Configured() || !ready || connecting || authenticated}
        onClick={signInWithWallet}
      >
        <Wallet className="h-4 w-4 shrink-0" aria-hidden />
        {label}
      </Button>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function MarketplaceAuthButtons({ redirectTo, intent }: MarketplaceAuthButtonsProps) {
  return (
    <div className="space-y-2.5">
      <GoogleAuthButton redirectTo={redirectTo} intent={intent} />
      <WalletAuthButton />
    </div>
  );
}
