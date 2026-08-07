"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { safeRedirect } from "@/lib/auth/redirect";
import {
  AtlasIdentityCard,
  type AtlasIdentityMode,
} from "@/components/atlas/identity/AtlasIdentityCard";

type AtlasIdentityModalProps = {
  open: boolean;
  mode: AtlasIdentityMode;
  redirect: string | null;
  message: string | null;
  onClose: () => void;
  onModeChange: (mode: AtlasIdentityMode) => void;
  onSuccess: (destination: string) => void;
};

export function AtlasIdentityModal({
  open,
  mode,
  redirect,
  message,
  onClose,
  onModeChange,
  onSuccess,
}: AtlasIdentityModalProps) {
  useScrollLock(open);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6"
          role="presentation"
          onClick={onClose}
        >
          <motion.div
            aria-hidden
            className="absolute inset-0 nxr-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <div className="relative max-h-[min(640px,calc(100dvh-2rem))] w-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              aria-label="Close authentication"
              onClick={onClose}
              className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/60 text-muted transition-colors hover:border-gold/35 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>

            <AtlasIdentityCard
              mode={mode}
              redirect={redirect}
              message={message}
              onModeChange={onModeChange}
              onSuccess={onSuccess}
              className="mx-auto max-h-none"
            />
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

type AtlasIdentityPageProps = {
  initialMode?: AtlasIdentityMode;
  redirect?: string | null;
  message?: string | null;
};

/** Inline identity card for `/login` and other auth routes. */
export function AtlasIdentityPage({
  initialMode = "signin",
  redirect = null,
  message = null,
}: AtlasIdentityPageProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AtlasIdentityMode>(initialMode);

  const handleSuccess = (destination: string) => {
    router.push(safeRedirect(destination));
    router.refresh();
  };

  return (
    <AtlasIdentityCard
      mode={mode}
      redirect={redirect}
      message={message}
      onModeChange={setMode}
      onSuccess={handleSuccess}
    />
  );
}
