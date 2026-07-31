"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { getAddress } from "viem";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { GlobalBackground } from "@/components/ui/GlobalBackground";
import { Logo } from "@/components/ui/Logo";
import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { SuperAdminVerifyButton } from "@/components/web3/SuperAdminVerifyButton";
import { Button } from "@/components/ui/Button";
import { isWeb3Configured } from "@/components/providers/Web3Provider";

type WalletStatus = {
  isTreasuryWallet: boolean;
  authenticated: boolean;
};

export default function AdminLoginPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const denied = searchParams.get("denied") === "1";
  const { user, authenticated, ready } = usePrivy();
  const { address: wagmiAddress, isConnected } = useAccount();
  const [statusByWallet, setStatusByWallet] = useState<Record<string, WalletStatus>>({});

  const rawAddress = wagmiAddress ?? user?.wallet?.address;
  const address = rawAddress
    ? (() => {
        try {
          return getAddress(rawAddress);
        } catch {
          return undefined;
        }
      })()
    : undefined;

  const walletStatus = address ? statusByWallet[address] : undefined;
  const checking = Boolean(authenticated && address && walletStatus === undefined);

  useEffect(() => {
    if (!ready || !authenticated || !address || statusByWallet[address]) return;

    let cancelled = false;

    fetch(`/api/admin/wallet/status?wallet=${encodeURIComponent(address)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: WalletStatus | null) => {
        if (cancelled) return;
        setStatusByWallet((prev) => ({
          ...prev,
          [address]: data ?? { isTreasuryWallet: false, authenticated: false },
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, address, statusByWallet]);

  useEffect(() => {
    if (walletStatus?.authenticated) {
      router.replace("/admin/dashboard");
    }
  }, [walletStatus?.authenticated, router]);

  const showAccessDenied =
    denied ||
    (authenticated && address && walletStatus && !walletStatus.isTreasuryWallet && !checking);

  return (
    <>
      <GlobalBackground variant="login" />
      <main className="flex min-h-screen items-center justify-center px-6 py-16">
        <div className="mx-auto w-full max-w-[24rem] rounded-2xl border border-border/80 bg-card/55 p-6 text-center shadow-xl shadow-black/20 backdrop-blur-2xl">
          <div className="mb-4 flex justify-center">
            <Logo showText={false} />
          </div>

          {showAccessDenied ? (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <ShieldAlert className="h-6 w-6 text-red-400" aria-hidden />
              </div>
              <h1 className="font-heading text-xl font-semibold text-white">Access denied</h1>
              <p className="mt-3 text-xs leading-relaxed text-muted">
                This area is restricted to Nexar Network administrators. The connected wallet is not
                authorized for super-admin access.
              </p>
              {address ? (
                <p className="mt-3 break-all font-mono text-[10px] text-muted">{address}</p>
              ) : null}
              <div className="mt-6 space-y-3">
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Return home
                  </Button>
                </Link>
                <Link href="/marketplace">
                  <Button variant="secondary" className="w-full">
                    Go to marketplace
                  </Button>
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10">
                <ShieldCheck className="h-6 w-6 text-gold" aria-hidden />
              </div>
              <h1 className="font-heading text-xl font-semibold text-gold">Admin access</h1>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                This area is restricted to Nexar Network administrators. Connect the authorized
                treasury wallet to enter the admin dashboard.
              </p>

              <div className="mt-5 space-y-3">
                {!isWeb3Configured() ? (
                  <p className="text-xs text-red-400">Wallet provider is not configured.</p>
                ) : (
                  <>
                    <ConnectWalletButton className="w-full" size="lg" magnetic glow />
                    {authenticated && address && walletStatus?.isTreasuryWallet && isConnected ? (
                      <SuperAdminVerifyButton walletAddress={address} />
                    ) : null}
                    {checking ? (
                      <p className="text-xs text-muted">Checking wallet authorization…</p>
                    ) : null}
                  </>
                )}
                <Link href="/">
                  <Button variant="outline" className="w-full">
                    Return home
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
