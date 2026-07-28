"use client";

import { useEffect, useRef } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useSignMessage } from "wagmi";
import { toast } from "sonner";
import { isWeb3Configured } from "@/components/providers/Web3Provider";

/**
 * When the connected wallet is the treasury wallet, prompt signature verification
 * so super-admin access is granted without hunting for a hidden menu action.
 */
export function TreasuryAdminAutoVerify() {
  const { user, authenticated, ready } = usePrivy();
  const { signMessageAsync } = useSignMessage();
  const verifyingRef = useRef(false);
  const attemptedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !authenticated || !isWeb3Configured()) return;

    const address = user?.wallet?.address;
    if (!address || verifyingRef.current) return;
    if (attemptedRef.current === address) return;

    let cancelled = false;

    async function maybeVerify() {
      const statusRes = await fetch(`/api/admin/wallet/status?wallet=${encodeURIComponent(address!)}`);
      const status = await statusRes.json();
      if (cancelled) return;

      if (!status.isTreasuryWallet || status.authenticated) {
        attemptedRef.current = address!;
        return;
      }

      verifyingRef.current = true;
      try {
        const challengeRes = await fetch("/api/admin/wallet/challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: address }),
        });
        if (!challengeRes.ok) throw new Error("Unable to start admin verification");
        const challenge = await challengeRes.json();
        const signature = await signMessageAsync({ message: challenge.message });
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
        toast.success("Super Admin access granted");
        window.dispatchEvent(new CustomEvent("nxr:super-admin-updated"));
      } catch (error) {
        if (!cancelled) {
          toast.error(error instanceof Error ? error.message : "Admin verification failed");
        }
      } finally {
        verifyingRef.current = false;
        attemptedRef.current = address!;
      }
    }

    void maybeVerify();
    return () => {
      cancelled = true;
    };
  }, [ready, authenticated, user?.wallet?.address, signMessageAsync]);

  return null;
}
