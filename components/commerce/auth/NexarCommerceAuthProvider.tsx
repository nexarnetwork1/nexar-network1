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
import type {
  CommerceAuthMode,
  CommerceAuthRole,
} from "@/lib/commerce/commerce-auth-url";
import { NexarCommerceAuthModal } from "@/components/commerce/auth/NexarCommerceAuthModal";
import { useScrollLock } from "@/hooks/useScrollLock";

type OpenCommerceAuthOptions = {
  mode?: CommerceAuthMode;
  role?: CommerceAuthRole;
  redirect?: string;
  message?: string;
};

type CommerceAuthContextValue = {
  open: boolean;
  mode: CommerceAuthMode;
  role: CommerceAuthRole;
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
  const [mode, setMode] = useState<CommerceAuthMode>("signin");
  const [role, setRole] = useState<CommerceAuthRole>("customer");
  const [redirect, setRedirect] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const openCommerceAuth = useCallback((options?: OpenCommerceAuthOptions) => {
    const nextMode = options?.mode ?? "signin";
    setMode(nextMode);
    setRole(options?.role ?? "customer");
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
      router.push(destination);
      router.refresh();
    },
    [closeCommerceAuth, router],
  );

  const value = useMemo(
    () => ({
      open,
      mode,
      role,
      redirect,
      message,
      openCommerceAuth,
      closeCommerceAuth,
    }),
    [open, mode, role, redirect, message, openCommerceAuth, closeCommerceAuth],
  );

  useScrollLock(open);

  return (
    <CommerceAuthContext.Provider value={value}>
      {children}
      <NexarCommerceAuthModal
        open={open}
        mode={mode}
        role={role}
        redirect={redirect}
        message={message}
        onClose={closeCommerceAuth}
        onModeChange={setMode}
        onRoleChange={setRole}
        onSuccess={handleSuccess}
      />
    </CommerceAuthContext.Provider>
  );
}

type CommerceAuthTriggerProps = {
  children: ReactNode;
  mode?: CommerceAuthMode;
  role?: CommerceAuthRole;
  redirect?: string;
  className?: string;
  onClick?: () => void;
};

export function CommerceAuthTrigger({
  children,
  mode = "signin",
  role,
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
        openCommerceAuth({ mode, role, redirect });
      }}
    >
      {children}
    </button>
  );
}
