"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useScrollLock } from "@/hooks/useScrollLock";
import { CloseButton } from "@/components/ui/CloseButton";
import { WalletMenuPanel } from "./WalletMenuPanel";
import type { WalletPanelState } from "./useWalletPanel";

type WalletMobileSheetProps = {
  open: boolean;
  onClose: () => void;
  panel: WalletPanelState;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function WalletMobileSheet({ open, onClose, panel }: WalletMobileSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => closeRef.current?.focus(), 60);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const root = sheetRef.current;
      if (!root) return;

      const focusable = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => !el.closest("[aria-hidden]"),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close wallet menu"
            className="fixed inset-0 z-[85] bg-background/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label="Wallet"
            className="fixed inset-x-0 bottom-0 z-[90] flex max-h-[min(92dvh,640px)] flex-col overflow-hidden rounded-t-[1.75rem] border border-gold/20 bg-chrome/95 shadow-[0_-8px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl will-change-transform"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="font-heading text-sm font-semibold text-white">Wallet</p>
                <p className="text-xs text-muted">{panel.meta.label}</p>
              </div>
              <CloseButton ref={closeRef} onClick={onClose} size="md" label="Close wallet menu" />
            </div>
            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]"
              data-scroll-lock-scrollable
            >
              <WalletMenuPanel panel={panel} onDisconnect={onClose} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
