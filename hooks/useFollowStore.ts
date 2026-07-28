"use client";

import { useCallback, useState } from "react";

const FOLLOW_KEY = "nxr_followed_stores";

function readFollowedStores(): string[] {
  try {
    const raw = localStorage.getItem(FOLLOW_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function useFollowStore() {
  const [slugs, setSlugs] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readFollowedStores()
  );

  const toggle = useCallback((slug: string) => {
    setSlugs((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      localStorage.setItem(FOLLOW_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFollowing = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  return { slugs, toggle, isFollowing };
}
