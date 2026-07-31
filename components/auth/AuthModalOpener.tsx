"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseAuthModalParams } from "@/lib/auth/auth-modal-url";
import { useAuthModal } from "@/components/auth/AuthModalProvider";

/** Opens the auth modal when ?auth=signin|register is present in the URL. */
export function AuthModalOpener() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openAuthModal } = useAuthModal();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const key = searchParams.toString();
    if (handledRef.current === key) return;

    const parsed = parseAuthModalParams(searchParams);
    if (!parsed.open || !parsed.mode) return;

    handledRef.current = key;
    openAuthModal({
      mode: parsed.mode,
      role: parsed.role ?? undefined,
      redirect: parsed.redirect ?? undefined,
      message: parsed.message ?? undefined,
    });

    const url = new URL(window.location.href);
    url.searchParams.delete("auth");
    url.searchParams.delete("role");
    url.searchParams.delete("message");
    router.replace(url.pathname + url.search + url.hash, { scroll: false });
  }, [searchParams, openAuthModal, router]);

  return null;
}
