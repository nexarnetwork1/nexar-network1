"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils/cn";
import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { Logo } from "@/components/ui/Logo";
import { CloseButton } from "@/components/ui/CloseButton";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Move focus into dialog when it opens
  useEffect(() => {
    if (open) {
      // Small delay to allow the animation to start before stealing focus
      const id = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 60);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Focus trap: keep Tab/Shift+Tab cycling inside the dialog
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
      ).filter((el) => !el.closest("[aria-hidden]"));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-[70] bg-background/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={dialogRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed top-0 right-0 z-[80] flex h-full w-full max-w-sm flex-col border-l border-border bg-surface/95 backdrop-blur-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <Logo />
              <CloseButton
                ref={closeButtonRef}
                onClick={onClose}
                size="md"
                label="Close navigation"
              />
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6" aria-label="Mobile navigation">
              {NAV_ITEMS.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center justify-between rounded-2xl px-4 py-3.5",
                      "font-heading text-lg text-white/90 transition-colors hover:bg-card hover:text-gold-secondary",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    )}
                  >
                    <span>{item.label}</span>
                    <span className="font-mono text-xs text-gold/40 transition-colors group-hover:text-gold" aria-hidden="true">
                      0{index + 1}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </nav>

            <div className="border-t border-border p-6">
              <ConnectWalletButton className="w-full" size="lg" magnetic />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
