"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useSignMessage } from "wagmi";
import { getAddress } from "viem";
import { toast } from "sonner";
import { isWeb3Configured } from "@/components/providers/Web3Provider";
import { isWalletSessionActive } from "@/lib/web3/wallet-session";

/**
 * When the connected wallet is the treasury wallet, prompt signature verification
 * so super-admin access is granted without hunting for a hidden menu action.
 */
export function TreasuryAdminAutoVerify() {
  const router = useRouter();
  const { user, authenticated, ready } = usePrivy();
  const { address: wagmiAddress, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const signMessageRef = useRef(signMessageAsync);
  useEffect(() => {
    signMessageRef.current = signMessageAsync;
  }, [signMessageAsync]);
  const verifyingRef = useRef(false);
  const verifiedRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (!ready || !authenticated || !isWeb3Configured() || !address) return;
    if (!isWalletSessionActive()) return;
    if (verifyingRef.current || verifiedRef.current === address) return;

    let cancelled = false;

    async function maybeVerify() {
      const statusRes = await fetch(
        `/api/admin/wallet/status?wallet=${encodeURIComponent(address!)}`
      );
      if (!statusRes.ok) return;
      const status = await statusRes.json();
      if (cancelled) return;

      if (status.authenticated) {
        verifiedRef.current = address!;
        return;
      }

      if (!status.isTreasuryWallet) {
        return;
      }

      if (!isConnected) {
        return;
      }

      verifyingRef.current = true;
      const verifyingToast = toast.loading("Verifying Super Admin access…");

      try {
        const challengeRes = await fetch("/api/admin/wallet/challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: address }),
        });
        if (!challengeRes.ok) {
          throw new Error("Unable to start admin verification");
        }

        const challenge = await challengeRes.json();
        const signature = await signMessageRef.current({ message: challenge.message });
        const verifyRes = await fetch("/api/admin/wallet/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            challengeId: challenge.challengeId,
            walletAddress: address,
            signature,
          }),
        });

        if (!verifyRes.ok) {
          const body = await verifyRes.json().catch(() => ({}));
          throw new Error(body.error ?? "Admin verification failed");
        }

        verifiedRef.current = address!;
        toast.success("Super Admin access granted", { id: verifyingToast });
        window.dispatchEvent(new CustomEvent("nxr:super-admin-updated"));
        router.refresh();
        router.push("/admin/dashboard");
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Admin verification failed", {
            id: verifyingToast,
          });
        }
      } finally {
        verifyingRef.current = false;
      }
    }

    void maybeVerify();
    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, address, isConnected, router]);

  return null;
}
