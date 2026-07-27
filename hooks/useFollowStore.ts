"use client";

import { useCallback, useEffect, useState } from "react";

const FOLLOW_KEY = "nxr_followed_stores";

export function useFollowStore() {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FOLLOW_KEY);
      setSlugs(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setSlugs([]);
    }
  }, []);

  const toggle = useCallback(
    (slug: string) => {
      setSlugs((prev) => {
        const next = prev.includes(slug)
          ? prev.filter((s) => s !== slug)
          : [...prev, slug];
        localStorage.setItem(FOLLOW_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const isFollowing = useCallback((slug: string) => slugs.includes(slug), [slugs]);

  return { slugs, toggle, isFollowing };
}
