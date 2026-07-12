"use client";

import { useState } from "react";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { CloseButton } from "@/components/ui/CloseButton";
import { getAppKit } from "@/components/web3/AppKitInit";
import { CONTRACTS } from "@/lib/constants/site";
import { PRESALE_ABI } from "@/lib/web3/abi";
import { isWeb3Configured } from "@/components/providers/Web3Provider";
import { usePresaleData } from "@/lib/web3/hooks/usePresaleData";
import { cn } from "@/lib/utils/cn";

type ClaimNxrModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ClaimNxrModal({ open, onClose }: ClaimNxrModalProps) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { writeContract, data: txHash, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });
  const { claimableAmount, purchasedAmount, refetch } = usePresaleData();

  const handleClaim = () => {
    reset();
    const appKit = getAppKit();
    if (!isConnected) {
      appKit?.open();
      return;
    }
    if (chainId !== 56) {
      switchChain({ chainId: 56 });
      return;
    }
    writeContract({
      address: CONTRACTS.presale as `0x${string}`,
      abi: PRESALE_ABI,
      functionName: "claim",
      chainId: 56,
    });
  };

  if (!isWeb3Configured()) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 z-[101] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2"
          >
            <div className="luxury-border rounded-3xl bg-surface/95 p-8 backdrop-blur-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-heading text-xl font-semibold">Claim NXR</h3>
                <CloseButton onClick={onClose} size="sm" label="Close claim modal" />
              </div>

              <div className="mb-6 rounded-2xl border border-border bg-background/60 p-5 text-center">
                <p className="text-[10px] tracking-[0.2em] text-muted uppercase">Claimable</p>
                <p className="mt-2 font-mono text-3xl font-semibold text-gradient-gold">
                  {claimableAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} NXR
                </p>
                {purchasedAmount > 0 && (
                  <p className="mt-2 font-mono text-[11px] text-muted">
                    Total purchased: {purchasedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })} NXR
                  </p>
                )}
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleClaim}
                disabled={isPending || isConfirming || claimableAmount <= 0}
              >
                {isPending || isConfirming ? "Confirming…" : "Claim Tokens"}
              </Button>

              {isSuccess && (
                <p className="mt-4 text-center text-sm text-emerald-400">
                  Claim successful!{" "}
                  <button type="button" className="underline" onClick={() => refetch()}>
                    Refresh
                  </button>
                </p>
              )}
              {error && (
                <p className="mt-4 text-center text-sm text-red-400">
                  {error.message.slice(0, 120)}
                </p>
              )}

              {address && (
                <p className="mt-4 text-center font-mono text-[10px] text-muted/50">
                  {address.slice(0, 8)}…{address.slice(-6)}
                </p>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

type ClaimNxrButtonProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "ghost";
  magnetic?: boolean;
};

export function ClaimNxrButton({
  className,
  size = "md",
  variant = "outline",
  magnetic = true,
}: ClaimNxrButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const { claimableAmount, purchasedAmount, web3Ready, isLoading } = usePresaleData();

  if (!web3Ready) return null;

  // Hide entirely while loading to avoid flash of disabled state
  if (isLoading) return null;

  // If the user has never purchased, don't show the claim button at all
  if (purchasedAmount <= 0) return null;

  // User purchased but nothing is claimable yet — show a status indicator
  // instead of a disabled button with no context
  if (claimableAmount <= 0) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-4 py-2 text-xs text-muted",
          className,
        )}
        title="Tokens will be claimable after the presale ends"
      >
        <Gift className="h-3.5 w-3.5 shrink-0 text-gold/50" />
        <span>
          {purchasedAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} NXR purchased · not yet claimable
        </span>
      </div>
    );
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        magnetic={magnetic}
        className={cn(className)}
        onClick={() => setModalOpen(true)}
      >
        <Gift className="h-4 w-4" />
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
