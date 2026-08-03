"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useScrollLock } from "@/hooks/useScrollLock";
import { CloseButton } from "@/components/ui/CloseButton";
import type { DashboardNavSection } from "@/config/dashboard-nav";
import { DashboardNavList } from "./DashboardNavList";

type DashboardMobileDrawerProps = {
  open: boolean;
  onClose: () => void;
  sections: DashboardNavSection[];
  brand: string;
  subtitle?: string;
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Slide-in navigation for viewports below `md`, matching the wallet sheet's motion. */
export function DashboardMobileDrawer({
  open,
  onClose,
  sections,
  brand,
  subtitle,
}: DashboardMobileDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => closeRef.current?.focus(), 60);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      const root = panelRef.current;
      if (!root) return;

      const focusable = Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (element) => !element.closest("[aria-hidden]"),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey) {
        if (document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        event.preventDefault();
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
            aria-label="Close navigation"
            className="fixed inset-0 z-[70] bg-background/70 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            ref={panelRef}
            id="dashboard-mobile-nav"
            role="dialog"
            aria-modal="true"
            aria-label="Dashboard navigation"
            className="fixed inset-y-0 left-0 z-[80] flex h-dvh w-[min(20rem,86vw)] flex-col border-r border-border bg-background-secondary/90 backdrop-blur-2xl will-change-transform md:hidden"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
              <div className="min-w-0">
                <p className="truncate font-heading text-sm font-semibold text-gold">{brand}</p>
                {subtitle && <p className="truncate text-[11px] text-muted">{subtitle}</p>}
              </div>
              <CloseButton ref={closeRef} onClick={onClose} size="md" label="Close navigation" />
            </div>

            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]"
              data-scroll-lock-scrollable
            >
              <DashboardNavList sections={sections} onNavigate={onClose} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
