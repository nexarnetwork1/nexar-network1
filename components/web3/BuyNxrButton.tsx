"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { CloseButton } from "@/components/ui/CloseButton";
import { PresalePanel } from "@/components/web3/PresalePanel";
import { usePresaleData } from "@/lib/web3/hooks/usePresaleData";
import { isWeb3Configured } from "@/components/providers/Web3Provider";

type BuyNxrButtonProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "outline" | "ghost";
  magnetic?: boolean;
  glow?: boolean;
  children?: React.ReactNode;
  disabled?: boolean;
};

export function BuyNxrButton({
  className,
  size = "lg",
  variant = "secondary",
  magnetic = true,
  glow = true,
  children,
  disabled,
}: BuyNxrButtonProps) {
  const [open, setOpen] = useState(false);
  const { status, canClaim } = usePresaleData();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!isWeb3Configured()) {
    return (
      <Button size={size} variant={variant} className={className} disabled>
        {children ?? "Buy NXR"}
      </Button>
    );
  }

  const label =
    canClaim
      ? "Claim NXR"
      : status === "sold_out"
        ? "Sold Out"
        : status === "upcoming"
          ? "Presale Soon"
          : (children ?? "Buy NXR");

  const isDisabled =
    disabled || status === "sold_out" || status === "loading" || status === "error";

  return (
    <>
      <Button
        size={size}
        variant={variant}
        magnetic={magnetic}
        glow={glow}
        className={className}
        onClick={() => setOpen(true)}
        disabled={isDisabled && !canClaim}
      >
        {label}
      </Button>

      {mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
                  onClick={() => setOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="fixed top-1/2 left-1/2 z-[101] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto"
                >
                  <div className="relative">
                    <CloseButton
                      onClick={() => setOpen(false)}
                      className="absolute right-4 top-4 z-10"
                      size="sm"
                      label="Close presale modal"
                    />
                    <PresalePanel />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}

/** @deprecated Use BuyNxrButton modal — kept for import compatibility */
export function BuyNxrModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <CloseButton onClick={onClose} className="absolute right-4 top-4 z-10" size="sm" label="Close" />
        <PresalePanel />
      </div>
    </div>
  );
}

export { ClaimNxrModal, ClaimNxrButton } from "@/components/web3/ClaimNxrButton";
