"use client";

import { useCallback, useState } from "react";

const RECENT_KEY = "nxr_recently_viewed";
const MAX = 12;

function readRecentlyViewed(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>(() =>
    typeof window === "undefined" ? [] : readRecentlyViewed()
  );

  const track = useCallback((productId: string) => {
    setIds((prev) => {
      const next = [productId, ...prev.filter((id) => id !== productId)].slice(0, MAX);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { ids, track };
}
