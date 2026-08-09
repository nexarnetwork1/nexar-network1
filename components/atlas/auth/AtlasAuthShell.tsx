"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AtlasAuthProvider, useAtlasAuth } from "@/components/atlas/auth/AtlasAuthProvider";
import type { AtlasAuthIntent } from "@/modules/atlas-auth/types";

function AtlasAuthOpener() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { openAtlasAuth } = useAtlasAuth();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    const key = searchParams.toString();
    if (handledRef.current === key) return;

    const modeParam = searchParams.get("mode");
    const authParam = searchParams.get("auth");
    const errorParam = searchParams.get("error");

    if (!authParam && !modeParam && !errorParam) {
      handledRef.current = key;
      return;
    }

    const mode =
      modeParam === "register" ? "register" : authParam === "signin" || errorParam ? "signin" : null;

    if (!mode && !errorParam) {
      handledRef.current = key;
      return;
    }

    handledRef.current = key;

    const intent = searchParams.get("intent") as AtlasAuthIntent | null;

    openAtlasAuth({
      mode: mode ?? "signin",
      redirect: searchParams.get("redirect") ?? searchParams.get("callbackUrl") ?? undefined,
      intent: intent ?? undefined,
      message: errorParam ?? searchParams.get("message") ?? undefined,
    });

    const url = new URL(window.location.href);
    url.searchParams.delete("auth");
    url.searchParams.delete("role");
    url.searchParams.delete("message");
    url.searchParams.delete("error");
    url.searchParams.delete("callbackUrl");
    router.replace(url.pathname + url.search + url.hash, { scroll: false });
  }, [searchParams, openAtlasAuth, router]);

  return null;
}

export function AtlasAuthShell({ children }: { children: React.ReactNode }) {
  return (
    <AtlasAuthProvider>
      <Suspense fallback={null}>
        <AtlasAuthOpener />
      </Suspense>
      {children}
    </AtlasAuthProvider>
  );
}
