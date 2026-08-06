"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  NexarCommerceAuthProvider,
  useCommerceAuth,
} from "@/components/commerce/auth/NexarCommerceAuthProvider";

function CommerceAuthOpener() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openCommerceAuth } = useCommerceAuth();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const key = searchParams.toString();
    if (handledRef.current === key) return;

    const modeParam = searchParams.get("mode");
    const authParam = searchParams.get("auth");

    // Only open modal if explicitly requested via auth parameter
    if (!authParam && !modeParam) {
      handledRef.current = key;
      return;
    }

    const mode =
      modeParam === "register"
        ? "register"
        : authParam === "signin"
          ? "signin"
          : null;

    if (!mode) {
      handledRef.current = key;
      return;
    }

    const roleParam = searchParams.get("role");

    const role =
      roleParam === "customer" || roleParam === "merchant"
        ? roleParam
        : undefined;

    handledRef.current = key;

    openCommerceAuth({
      mode,
      role,
      redirect: searchParams.get("redirect") ?? undefined,
      message: searchParams.get("message") ?? undefined,
    });

    const url = new URL(window.location.href);
    url.searchParams.delete("auth");
    url.searchParams.delete("role");
    url.searchParams.delete("message");
    router.replace(url.pathname + url.search + url.hash, { scroll: false });
  }, [searchParams, openCommerceAuth, router]);

  return null;
}

export function CommerceAuthShell({ children }: { children: React.ReactNode }) {
  return (
    <NexarCommerceAuthProvider>
      <Suspense fallback={null}>
        <CommerceAuthOpener />
      </Suspense>
      {children}
    </NexarCommerceAuthProvider>
  );
}
