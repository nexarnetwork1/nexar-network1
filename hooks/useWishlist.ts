"use client";

import { useCallback, useEffect, useState } from "react";

const WISHLIST_KEY = "nxr_wishlist";

export function useWishlist() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      setIds(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      setIds([]);
    }
  }, []);

  const persist = useCallback((next: string[]) => {
    setIds(next);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
  }, []);

  const toggle = useCallback(
    (productId: string) => {
      persist(
        ids.includes(productId)
          ? ids.filter((id) => id !== productId)
          : [...ids, productId]
      );
    },
    [ids, persist]
  );

  const has = useCallback((productId: string) => ids.includes(productId), [ids]);

  return { ids, toggle, has };
}
