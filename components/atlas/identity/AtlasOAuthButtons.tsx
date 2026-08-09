"use client";

import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { signIn } from "next-auth/react";
import { buildOAuthCallbackPath } from "@/lib/auth/redirect";
import { cn } from "@/lib/utils/cn";
import { AtlasWalletConnectPanel } from "@/components/atlas/auth/AtlasWalletConnectPanel";

type AtlasOAuthButtonsProps = {
  redirectTo?: string;
  onWalletAddress?: (address: string) => void;
  layout?: "stack" | "grid";
  /** When true, wallet connect only captures address for optional registration field. */
  walletOptional?: boolean;
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
  walletOptional = true,
}: AtlasOAuthButtonsProps) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [githubLoading, setGithubLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const googleStartedRef = useRef(false);
  const githubStartedRef = useRef(false);

  async function startOAuth(provider: "google" | "github") {
    const startedRef = provider === "google" ? googleStartedRef : githubStartedRef;
    const setLoading = provider === "google" ? setGoogleLoading : setGithubLoading;
    if (startedRef.current) return;

    startedRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const callbackUrl = buildOAuthCallbackPath(redirectTo ?? "/atlas");
      await signIn(provider, { callbackUrl, redirect: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} sign-in failed`);
      startedRef.current = false;
      setLoading(false);
    }
  }

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
      </div>

      <div className="pt-1">
        <p className="mb-2 text-[10px] font-medium tracking-[0.16em] text-muted uppercase text-center">
          Optional
        </p>
        <AtlasWalletConnectPanel
          requireAuth={!walletOptional}
          onAddress={onWalletAddress}
        />
      </div>

      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
