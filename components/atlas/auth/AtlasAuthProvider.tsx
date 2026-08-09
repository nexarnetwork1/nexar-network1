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
import { AtlasIdentityModal } from "@/components/atlas/identity/AtlasIdentityModal";
import type { AtlasIdentityMode } from "@/components/atlas/identity/AtlasIdentityCard";
import type { AtlasAuthIntent, OpenAtlasAuthOptions } from "@/modules/atlas-auth/types";

type AtlasAuthContextValue = {
  open: boolean;
  mode: AtlasIdentityMode;
  redirect: string | null;
  intent: AtlasAuthIntent | null;
  message: string | null;
  openAtlasAuth: (options?: OpenAtlasAuthOptions) => void;
  closeAtlasAuth: () => void;
};

const AtlasAuthContext = createContext<AtlasAuthContextValue | null>(null);

export function useAtlasAuth(): AtlasAuthContextValue {
  const ctx = useContext(AtlasAuthContext);
  if (!ctx) {
    throw new Error("useAtlasAuth must be used within AtlasAuthProvider");
  }
  return ctx;
}

type AtlasAuthProviderProps = {
  children: ReactNode;
};

export function AtlasAuthProvider({ children }: AtlasAuthProviderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AtlasIdentityMode>("signin");
  const [redirect, setRedirect] = useState<string | null>(null);
  const [intent, setIntent] = useState<AtlasAuthIntent | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const openAtlasAuth = useCallback((options?: OpenAtlasAuthOptions) => {
    setMode(options?.mode ?? "signin");
    setRedirect(options?.redirect ?? null);
    setIntent(options?.intent ?? null);
    setMessage(options?.message ?? null);
    setOpen(true);
  }, []);

  const closeAtlasAuth = useCallback(() => {
    setOpen(false);
    setMessage(null);
  }, []);

  const handleSuccess = useCallback(
    (destination: string) => {
      closeAtlasAuth();
      router.push(safeRedirect(destination));
      router.refresh();
    },
    [closeAtlasAuth, router],
  );

  const value = useMemo(
    () => ({
      open,
      mode,
      redirect,
      intent,
      message,
      openAtlasAuth,
      closeAtlasAuth,
    }),
    [open, mode, redirect, intent, message, openAtlasAuth, closeAtlasAuth],
  );

  return (
    <AtlasAuthContext.Provider value={value}>
      {children}
      <AtlasIdentityModal
        open={open}
        mode={mode}
        redirect={redirect}
        message={message}
        onClose={closeAtlasAuth}
        onModeChange={setMode}
        onSuccess={handleSuccess}
      />
    </AtlasAuthContext.Provider>
  );
}

type AtlasAuthTriggerProps = {
  children: ReactNode;
  mode?: AtlasIdentityMode;
  redirect?: string;
  intent?: AtlasAuthIntent;
  className?: string;
  onClick?: () => void;
};

export function AtlasAuthTrigger({
  children,
  mode = "signin",
  redirect,
  intent,
  className,
  onClick,
}: AtlasAuthTriggerProps) {
  const { openAtlasAuth } = useAtlasAuth();

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        onClick?.();
        openAtlasAuth({ mode, redirect, intent });
      }}
    >
      {children}
    </button>
  );
}
