"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { safeRedirect } from "@/lib/auth/redirect";
import {
  AtlasIdentityModal,
} from "@/components/atlas/identity/AtlasIdentityModal";
import type { AtlasIdentityMode } from "@/components/atlas/identity/AtlasIdentityCard";

type OpenCommerceAuthOptions = {
  mode?: AtlasIdentityMode;
  /** @deprecated Role selection removed — unified ATLAS identity only. */
  role?: "customer" | "merchant";
  redirect?: string;
  message?: string;
};

type CommerceAuthContextValue = {
  open: boolean;
  mode: AtlasIdentityMode;
  redirect: string | null;
  message: string | null;
  openCommerceAuth: (options?: OpenCommerceAuthOptions) => void;
  closeCommerceAuth: () => void;
};

const CommerceAuthContext = createContext<CommerceAuthContextValue | null>(null);

export function useCommerceAuth(): CommerceAuthContextValue {
  const ctx = useContext(CommerceAuthContext);
  if (!ctx) {
    throw new Error("useCommerceAuth must be used within NexarCommerceAuthProvider");
  }
  return ctx;
}

type NexarCommerceAuthProviderProps = {
  children: ReactNode;
};

export function NexarCommerceAuthProvider({ children }: NexarCommerceAuthProviderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AtlasIdentityMode>("signin");
  const [redirect, setRedirect] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const openCommerceAuth = useCallback((options?: OpenCommerceAuthOptions) => {
    setMode(options?.mode ?? "signin");
    setRedirect(options?.redirect ?? null);
    setMessage(options?.message ?? null);
    setOpen(true);
  }, []);

  const closeCommerceAuth = useCallback(() => {
    setOpen(false);
    setMessage(null);
  }, []);

  const handleSuccess = useCallback(
    (destination: string) => {
      closeCommerceAuth();
      router.push(safeRedirect(destination));
      router.refresh();
    },
    [closeCommerceAuth, router],
  );

  const value = useMemo(
    () => ({
      open,
      mode,
      redirect,
      message,
      openCommerceAuth,
      closeCommerceAuth,
    }),
    [open, mode, redirect, message, openCommerceAuth, closeCommerceAuth],
  );

  return (
    <CommerceAuthContext.Provider value={value}>
      {children}
      <AtlasIdentityModal
        open={open}
        mode={mode}
        redirect={redirect}
        message={message}
        onClose={closeCommerceAuth}
        onModeChange={setMode}
        onSuccess={handleSuccess}
      />
    </CommerceAuthContext.Provider>
  );
}

type CommerceAuthTriggerProps = {
  children: ReactNode;
  mode?: AtlasIdentityMode;
  /** @deprecated Ignored — unified identity only. */
  role?: "customer" | "merchant";
  redirect?: string;
  className?: string;
  onClick?: () => void;
};

export function CommerceAuthTrigger({
  children,
  mode = "signin",
  redirect,
  className,
  onClick,
}: CommerceAuthTriggerProps) {
  const { openCommerceAuth } = useCommerceAuth();

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        onClick?.();
        openCommerceAuth({ mode, redirect });
      }}
    >
      {children}
    </button>
  );
}
