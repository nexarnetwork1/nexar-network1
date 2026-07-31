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
import Link from "next/link";
import { X } from "lucide-react";
import type { AuthModalMode, AuthModalRole } from "@/lib/auth/auth-modal-url";
import { AuthModalPanel } from "@/components/auth/AuthModalPanel";
import { useScrollLock } from "@/hooks/useScrollLock";
import { cn } from "@/lib/utils/cn";

type AuthModalView = "signin" | "register-choice" | "register-customer" | "register-merchant";

type OpenAuthModalOptions = {
  mode?: AuthModalMode;
  role?: AuthModalRole;
  redirect?: string;
  message?: string;
};

type AuthModalContextValue = {
  open: boolean;
  view: AuthModalView;
  redirect: string | null;
  message: string | null;
  openAuthModal: (options?: OpenAuthModalOptions) => void;
  closeAuthModal: () => void;
  setView: (view: AuthModalView) => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return ctx;
}

function modeToView(mode: AuthModalMode, role?: AuthModalRole | null): AuthModalView {
  if (mode === "signin") return "signin";
  if (role === "customer") return "register-customer";
  if (role === "merchant") return "register-merchant";
  return "register-choice";
}

type AuthModalProviderProps = {
  children: ReactNode;
};

export function AuthModalProvider({ children }: AuthModalProviderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<AuthModalView>("signin");
  const [redirect, setRedirect] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const openAuthModal = useCallback((options?: OpenAuthModalOptions) => {
    const mode = options?.mode ?? "signin";
    setView(modeToView(mode, options?.role));
    setRedirect(options?.redirect ?? null);
    setMessage(options?.message ?? null);
    setOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setOpen(false);
    setMessage(null);
  }, []);

  const handleSuccess = useCallback(
    (destination: string) => {
      closeAuthModal();
      router.push(destination);
      router.refresh();
    },
    [closeAuthModal, router],
  );

  const value = useMemo(
    () => ({
      open,
      view,
      redirect,
      message,
      openAuthModal,
      closeAuthModal,
      setView,
    }),
    [open, view, redirect, message, openAuthModal, closeAuthModal],
  );

  useScrollLock(open);

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      {open ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          onClick={closeAuthModal}
        >
          <div
            className={cn(
              "relative max-h-[92vh] w-full max-w-[26rem] overflow-y-auto rounded-2xl border border-border/80",
              "bg-card/90 shadow-2xl shadow-black/40 backdrop-blur-2xl",
            )}
            data-scroll-lock-scrollable
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={closeAuthModal}
              className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-muted transition-colors hover:border-gold/30 hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
            <AuthModalPanel
              view={view}
              redirect={redirect}
              message={message}
              onViewChange={setView}
              onSuccess={handleSuccess}
            />
          </div>
        </div>
      ) : null}
    </AuthModalContext.Provider>
  );
}

type AuthModalTriggerProps = {
  children: ReactNode;
  mode?: AuthModalMode;
  role?: AuthModalRole;
  redirect?: string;
  className?: string;
  onClick?: () => void;
};

/** Opens the unified auth modal instead of navigating to legacy auth pages. */
export function AuthModalTrigger({
  children,
  mode = "signin",
  role,
  redirect,
  className,
  onClick,
}: AuthModalTriggerProps) {
  const { openAuthModal } = useAuthModal();

  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        onClick?.();
        openAuthModal({ mode, role, redirect });
      }}
    >
      {children}
    </button>
  );
}

type AuthModalLinkProps = {
  children: ReactNode;
  mode?: AuthModalMode;
  role?: AuthModalRole;
  redirect?: string;
  className?: string;
  href?: string;
};

/** Styled like a link but opens the auth modal. Keeps href for progressive enhancement / SEO. */
export function AuthModalLink({
  children,
  mode = "signin",
  role,
  redirect,
  className,
}: AuthModalLinkProps) {
  const { openAuthModal } = useAuthModal();

  return (
    <Link
      href="#"
      className={className}
      onClick={(event) => {
        event.preventDefault();
        openAuthModal({ mode, role, redirect });
      }}
    >
      {children}
    </Link>
  );
}
