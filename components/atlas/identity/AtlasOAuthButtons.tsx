"use client";

import { useRef, useState } from "react";
import { Loader2, Wallet } from "lucide-react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { signIn } from "next-auth/react";
import { usePrivy } from "@privy-io/react-auth";
import { isWeb3Configured } from "@/components/providers/Web3Provider";
import { markWalletSessionActive } from "@/lib/web3/wallet-session";
import { linkOrLoginWalletAction } from "@/modules/auth/actions";
import { cn } from "@/lib/utils/cn";
import { getOAuthCallbackOrigin } from "@/lib/auth/app-url";

type AtlasOAuthButtonsProps = {
  redirectTo?: string;
  onWalletAddress?: (address: string) => void;
  layout?: "stack" | "grid";
};

function OAuthButton({
  label,
  icon,
  loading,
  disabled,
  onClick,
  className,
}: {
  label: string;
  icon: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-black/40 px-4 py-2.5 text-sm font-medium text-white transition-all hover:border-gold/30 hover:bg-gold/5 disabled:opacity-60",
        className,
      )}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : icon}
      {label}
    </button>
  );
}

export function AtlasOAuthButtons({
  redirectTo,
  onWalletAddress,
  layout = "stack",
}: AtlasOAuthButtonsProps) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleStartedRef = useRef(false);
  const githubStartedRef = useRef(false);
  const { login, ready, authenticated, user } = usePrivy();

  async function startOAuth(provider: "google" | "github") {
    const startedRef = provider === "google" ? googleStartedRef : githubStartedRef;
    const setLoading = provider === "google" ? setGoogleLoading : setGithubLoading;
    if (startedRef.current) return;

    startedRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const appUrl = getOAuthCallbackOrigin().replace(/\/$/, "");
      const destination = redirectTo ?? "/atlas";
      const callbackUrl = `${appUrl}/auth/callback?${new URLSearchParams({ redirect: destination }).toString()}`;
      await signIn(provider, { callbackUrl, redirect: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} sign-in failed`);
      startedRef.current = false;
      setLoading(false);
    }
  }

  async function handleWallet() {
    if (!isWeb3Configured()) {
      setError("Wallet provider is not configured.");
      return;
    }
    if (!ready || walletLoading) return;

    setWalletLoading(true);
    setError(null);
    try {
      if (!authenticated) {
        await login();
      }
      markWalletSessionActive();
      const address =
        user?.wallet?.address ??
        (window as unknown as { ethereum?: { selectedAddress?: string } }).ethereum
          ?.selectedAddress;
      if (address) {
        onWalletAddress?.(address);
        const result = await linkOrLoginWalletAction(address, redirectTo ?? "/atlas");
        if (!result.success) {
          setError(result.error ?? "Wallet link failed");
        } else if (result.redirectTo) {
          window.location.href = result.redirectTo;
          return;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wallet connection failed");
    } finally {
      setWalletLoading(false);
    }
  }

  const walletLabel = authenticated
    ? "Wallet connected"
    : walletLoading
      ? "Connecting…"
      : "Connect Wallet";

  return (
    <div className="space-y-2">
      <div className={cn(layout === "grid" ? "grid grid-cols-1 sm:grid-cols-2 gap-2" : "space-y-2")}>
        <OAuthButton
          label="Continue with Google"
          icon={<FaGoogle className="h-4 w-4 shrink-0" aria-hidden />}
          loading={googleLoading}
          onClick={() => void startOAuth("google")}
        />
        <OAuthButton
          label="Continue with GitHub"
          icon={<FaGithub className="h-4 w-4 shrink-0" aria-hidden />}
          loading={githubLoading}
          onClick={() => void startOAuth("github")}
        />
        <OAuthButton
          label={walletLabel}
          icon={
            walletLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Wallet className="h-4 w-4 shrink-0 text-gold" aria-hidden />
            )
          }
          disabled={!isWeb3Configured() || !ready}
          onClick={() => void handleWallet()}
          className="border-gold/25 bg-gold/5 text-gold hover:border-gold/40 hover:bg-gold/10"
        />
      </div>
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
