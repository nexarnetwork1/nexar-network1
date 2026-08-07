"use client";

import { useEffect } from "react";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";

interface PremiumAuthModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  redirect?: string;
  mode?: "signin" | "register";
}

/** @deprecated Use `openCommerceAuth()` — opens unified ATLAS Identity modal. */
export function PremiumAuthModal({
  isOpen = true,
  onClose,
  redirect,
  mode = "signin",
}: PremiumAuthModalProps) {
  const { openCommerceAuth } = useCommerceAuth();

  useEffect(() => {
    if (!isOpen) return;
    openCommerceAuth({
      mode,
      redirect: redirect ?? (typeof window !== "undefined" ? window.location.pathname : "/atlas"),
    });
    onClose?.();
  }, [isOpen, mode, redirect, onClose, openCommerceAuth]);

  return null;
}
