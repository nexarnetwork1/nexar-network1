"use client";

import { useState } from "react";
import { Gift } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PresalePanel } from "@/components/web3/PresalePanel";
import { PresaleNetworkProvider } from "@/components/providers/PresaleNetworkProvider";
import { usePresaleData } from "@/lib/web3/hooks/usePresaleData";
import { isWeb3Configured } from "@/components/providers/Web3Provider";
import { useScrollLock } from "@/hooks/useScrollLock";
import { cn } from "@/lib/utils/cn";

type ClaimNxrModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ClaimNxrModal({ open, onClose }: ClaimNxrModalProps) {
  useScrollLock(open);

  if (!open || !isWeb3Configured()) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto"
        data-scroll-lock-scrollable
        onClick={(e) => e.stopPropagation()}
      >
        <PresaleNetworkProvider>
          <PresalePanel />
        </PresaleNetworkProvider>
      </div>
    </div>
  );
}

type ClaimNxrButtonProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "ghost";
  magnetic?: boolean;
  glow?: boolean;
};

export function ClaimNxrButton({
  className,
  size = "md",
  variant = "outline",
  magnetic = true,
  glow = false,
}: ClaimNxrButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { claimableAmount, purchasedAmount, canClaim, isLoading } = usePresaleData();

  if (!isWeb3Configured() || isLoading || purchasedAmount <= 0) return null;

  if (!canClaim) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-xs text-muted",
          className
        )}
      >
        <Gift className="h-3.5 w-3.5 shrink-0 text-gold/50" aria-hidden />
        <span>{purchasedAmount.toLocaleString()} NXR purchased</span>
      </div>
    );
  }

  if (claimableAmount <= 0 && purchasedAmount > 0) {
    return (
      <div className={cn("text-xs text-muted", className)}>
        All purchased tokens claimed
      </div>
    );
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        magnetic={magnetic}
        glow={glow}
        className={cn(className)}
        onClick={() => setModalOpen(true)}
      >
        <Gift className="h-4 w-4" aria-hidden />
        Claim NXR
        <span className="ml-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] text-emerald-400">
          {claimableAmount >= 1000
            ? `${(claimableAmount / 1000).toFixed(1)}K`
            : claimableAmount.toFixed(0)}
        </span>
      </Button>
      <ClaimNxrModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
