"use client";

import { useState } from "react";
import { useSignMessage } from "wagmi";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

type SuperAdminVerifyButtonProps = {
  walletAddress: string;
  onVerified?: () => void;
};

export function SuperAdminVerifyButton({
  walletAddress,
  onVerified,
}: SuperAdminVerifyButtonProps) {
  const { signMessageAsync } = useSignMessage();
  const [loading, setLoading] = useState(false);

  async function verifyAdminAccess() {
    setLoading(true);
    try {
      const challengeRes = await fetch("/api/admin/wallet/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress }),
      });

      if (!challengeRes.ok) {
        throw new Error("Failed to create verification challenge");
      }

      const challenge = await challengeRes.json();
      const signature = await signMessageAsync({ message: challenge.message });

      const verifyRes = await fetch("/api/admin/wallet/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: challenge.challengeId,
          walletAddress,
          signature,
        }),
      });

      if (!verifyRes.ok) {
        const body = await verifyRes.json().catch(() => ({}));
        throw new Error(body.error ?? "Wallet not authorized for admin access");
      }

      toast.success("Super Admin access granted");
      onVerified?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={verifyAdminAccess}
      disabled={loading}
      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm text-gold transition hover:bg-gold/10 disabled:opacity-50"
    >
      <ShieldCheck size={18} />
      {loading ? "Verifying…" : "Verify Super Admin Access"}
    </button>
  );
}
