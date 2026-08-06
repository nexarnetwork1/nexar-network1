"use client";

import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import Image from "next/image";
import { X, Sparkles } from "lucide-react";
import Link from "next/link";
import { ATLAS_BRAND } from "@/config/atlas-branding";

interface PremiumAuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  redirect?: string;
}

/** Opens the shared commerce auth modal — never redirects away from ATLAS. */
export function PremiumAuthModal({ isOpen = true, onClose, redirect }: PremiumAuthModalProps) {
  const { openCommerceAuth } = useCommerceAuth();

  if (!isOpen) return null;

  const handleOpen = (mode: "signin" | "register") => {
    openCommerceAuth({
      mode,
      redirect: redirect ?? (typeof window !== "undefined" ? window.location.pathname : "/atlas"),
      message: `Sign in to continue on ${ATLAS_BRAND.name}`,
    });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      <div className="relative w-full max-w-md bg-gradient-to-br from-[#0a0e1a] to-[#0d1225] border border-gold/20 rounded-2xl p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5"
        >
          <X className="h-5 w-5 text-muted" />
        </button>

        <div className="flex justify-center mb-6">
          <div className="relative h-20 w-20 rounded-2xl border border-gold/20 bg-gold/5 overflow-hidden">
            <Image
              src="/brand/atlas/atlas-icon-512.png"
              alt={ATLAS_BRAND.name}
              fill
              className="object-contain p-3"
              priority
            />
          </div>
        </div>

        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-gold" />
            <h2 className="text-2xl font-bold">Welcome to {ATLAS_BRAND.name}</h2>
            <Sparkles className="h-4 w-4 text-gold" />
          </div>
          <p className="text-sm text-muted">Sign in or create an account to continue</p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleOpen("signin")}
            className="w-full py-3 rounded-lg bg-gold text-background font-semibold hover:bg-gold-secondary"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => handleOpen("register")}
            className="w-full py-3 rounded-lg border border-white/10 hover:border-gold/30 font-medium"
          >
            Create Account
          </button>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="text-gold hover:underline">Terms</Link> and{" "}
          <Link href="/privacy" className="text-gold hover:underline">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
