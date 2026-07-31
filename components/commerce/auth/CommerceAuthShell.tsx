"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { parseCommerceAuthParams } from "@/lib/commerce/commerce-auth-url";
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

    const parsed = parseCommerceAuthParams(searchParams);
    if (!parsed.open || !parsed.mode) return;

    handledRef.current = key;
    openCommerceAuth({
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
