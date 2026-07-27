"use client";

import { useEffect, useState } from "react";
import { CSRF_HEADER } from "@/lib/security/csrf";

export function useCsrfToken(): string | null {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/csrf", { credentials: "same-origin" })
      .then((res) => res.json())
      .then((data: { token?: string }) => {
        if (!cancelled) setToken(data.token ?? null);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return token;
}

export function csrfHeaders(token: string | null): HeadersInit {
  if (!token) return {};
  return { [CSRF_HEADER]: token };
}
