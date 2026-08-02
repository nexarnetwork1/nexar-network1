"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Shield } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { NAV_ITEMS } from "@/lib/constants/navigation";
import { cn } from "@/lib/utils/cn";
import { ConnectWalletButton } from "@/components/web3/ConnectWalletButton";
import { NavLink } from "@/components/layout/NavLink";
import { Logo } from "@/components/ui/Logo";
import { CloseButton } from "@/components/ui/CloseButton";
import { useScrollLock } from "@/hooks/useScrollLock";

type MobileMenuProps = {
  open: boolean;
  onClose: () => void;
};

const FOCUSABLE_SELECTORS =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function MobileMenu({ open, onClose }: MobileMenuProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const { authenticated } = usePrivy();
  const [adminLinkVisible, setAdminLinkVisible] = useState(false);

  useScrollLock(open);

  useEffect(() => {
    fetch("/api/admin/wallet/status")
      .then((res) => res.json())
      .then((data) => setAdminLinkVisible(Boolean(data.authenticated)))
      .catch(() => setAdminLinkVisible(false));

    function onAdminUpdate() {
      fetch("/api/admin/wallet/status")
        .then((res) => res.json())
        .then((data) => setAdminLinkVisible(Boolean(data.authenticated)))
        .catch(() => setAdminLinkVisible(false));
    }

    window.addEventListener("nxr:super-admin-updated", onAdminUpdate);
    return () => window.removeEventListener("nxr:super-admin-updated", onAdminUpdate);
  }, [open]);

  useEffect(() => {
    if (pathnameRef.current !== pathname) {
      pathnameRef.current = pathname;
      if (open) onClose();
    }
  }, [pathname, open, onClose]);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 60);
      return () => clearTimeout(id);
    }
  }, [open]);

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
            className="fixed top-0 right-0 z-[80] flex h-[100dvh] w-full max-w-sm min-h-0 flex-col border-l border-border bg-surface/95 backdrop-blur-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-5">
              <Logo />
              <CloseButton
                ref={closeButtonRef}
                onClick={onClose}
                size="md"
                label="Close navigation"
              />
            </div>

            <nav
              className="mobile-menu-scroll flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-4 py-6"
              aria-label="Mobile navigation"
              data-scroll-lock-scrollable
            >
              {NAV_ITEMS.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <NavLink
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group flex items-center justify-between rounded-2xl px-4 py-3.5",
                      "font-heading text-lg text-white/90 transition-colors hover:bg-card hover:text-gold-secondary",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    )}
                  >
                    <span>{item.label}</span>
                    <span
                      className="font-mono text-xs text-gold/40 transition-colors group-hover:text-gold"
                      aria-hidden="true"
                    >
                      0{index + 1}
                    </span>
                  </NavLink>
                </motion.div>
              ))}
              {adminLinkVisible && (
                <NavLink
                  href="/admin/dashboard"
                  onClick={onClose}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-4 py-3.5",
                    "font-heading text-lg text-gold transition-colors hover:bg-card",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  )}
                >
                  <Shield className="h-5 w-5 shrink-0" aria-hidden />
                  <span>Admin dashboard</span>
                </NavLink>
              )}
            </nav>

            {!authenticated && (
              <div className="shrink-0 border-t border-border p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                <ConnectWalletButton className="w-full" size="lg" magnetic glow>
                  Connect Wallet
                </ConnectWalletButton>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
