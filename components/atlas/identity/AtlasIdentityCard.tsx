"use client";

import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { AtlasLogo } from "@/components/ui/AtlasLogo";
import { ATLAS_BRAND } from "@/config/atlas-branding";
import { AtlasSignInForm } from "@/components/atlas/identity/AtlasSignInForm";
import { AtlasRegisterForm } from "@/components/atlas/identity/AtlasRegisterForm";

export type AtlasIdentityMode = "signin" | "register";

type AtlasIdentityCardProps = {
  mode: AtlasIdentityMode;
  redirect?: string | null;
  message?: string | null;
  onModeChange: (mode: AtlasIdentityMode) => void;
  onSuccess: (destination: string) => void;
  className?: string;
};

export function AtlasIdentityCard({
  mode,
  redirect = null,
  message = null,
  onModeChange,
  onSuccess,
  className,
}: AtlasIdentityCardProps) {
  return (
    <div
      className={cn(
        "relative w-full max-w-[22rem] overflow-hidden rounded-[1.25rem] border border-gold/20 bg-[#070708]/95 p-5 shadow-[0_0_60px_-20px_rgba(212,175,55,0.4)] backdrop-blur-xl sm:max-w-[24rem] sm:p-6",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

      <header className="mb-4 text-center">
        <div className="mb-3 flex justify-center">
          <AtlasLogo height={40} priority />
        </div>
        <p className="text-[10px] font-semibold tracking-[0.28em] text-gold uppercase">
          {ATLAS_BRAND.name}
        </p>
        <h1 className="mt-2 font-heading text-xl font-semibold tracking-tight text-white">
          {mode === "signin" ? "Welcome back" : "Create your identity"}
        </h1>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">
          {mode === "signin"
            ? "Sign in once — access the full ATLAS ecosystem."
            : "Register once — unlock Marketplace, Business, Network, and more."}
        </p>
      </header>

      <div className="mb-4 flex rounded-full border border-white/10 bg-black/40 p-1">
        {(["signin", "register"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onModeChange(tab)}
            className={cn(
              "flex-1 rounded-full py-2 text-xs font-semibold tracking-wide transition-all",
              mode === tab
                ? "bg-gold/15 text-gold shadow-[inset_0_0_0_1px_rgba(212,175,55,0.35)]"
                : "text-muted hover:text-white",
            )}
          >
            {tab === "signin" ? "Sign In" : "Register"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {mode === "signin" ? (
          <AtlasSignInForm
            redirect={redirect}
            message={message}
            onSuccess={onSuccess}
            onSwitchRegister={() => onModeChange("register")}
          />
        ) : (
          <AtlasRegisterForm
            redirect={redirect}
            onSuccess={onSuccess}
            onSwitchSignIn={() => onModeChange("signin")}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
