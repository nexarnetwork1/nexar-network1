"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  getWishlistStateAction,
  syncGuestWishlistAction,
  toggleWishlistAction,
} from "@/modules/wishlist/actions";

const WISHLIST_SESSION_KEY = "nxr_wishlist_session";

function readGuestWishlist(): string[] {
  try {
    const raw = sessionStorage.getItem(WISHLIST_SESSION_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeGuestWishlist(ids: string[]) {
  sessionStorage.setItem(WISHLIST_SESSION_KEY, JSON.stringify(ids));
}

type WishlistContextValue = {
  ids: string[];
  ready: boolean;
  isAuthenticated: boolean;
  has: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  remove: (productId: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const guestIds = readGuestWishlist();
      const state = await getWishlistStateAction();

      if (cancelled) return;

      if (state.authenticated) {
        if (guestIds.length > 0) {
          const merged = await syncGuestWishlistAction(guestIds);
          if (!cancelled) {
            setIds(merged);
            sessionStorage.removeItem(WISHLIST_SESSION_KEY);
          }
        } else {
          setIds(state.ids);
        }
        setIsAuthenticated(true);
      } else {
        setIds(guestIds);
        setIsAuthenticated(false);
      }

      setReady(true);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const has = useCallback((productId: string) => ids.includes(productId), [ids]);

  const toggle = useCallback(
    async (productId: string) => {
      if (isAuthenticated) {
        const result = await toggleWishlistAction(productId);
        if (!result.success) {
          toast.error(result.error ?? "Could not update wishlist");
          return;
        }
        setIds((current) =>
          result.saved
            ? current.includes(productId)
              ? current
              : [...current, productId]
            : current.filter((id) => id !== productId)
        );
        return;
      }

      setIds((current) => {
        const next = current.includes(productId)
          ? current.filter((id) => id !== productId)
          : [...current, productId];
        writeGuestWishlist(next);
        return next;
      });
    },
    [isAuthenticated]
  );

  const remove = useCallback((productId: string) => {
    setIds((current) => {
      const next = current.filter((id) => id !== productId);
      if (!isAuthenticated) {
        writeGuestWishlist(next);
      }
      return next;
    });
  }, [isAuthenticated]);

  const value = useMemo(
    () => ({ ids, ready, isAuthenticated, has, toggle, remove }),
    [ids, ready, isAuthenticated, has, toggle, remove]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
}

export { WISHLIST_SESSION_KEY };
