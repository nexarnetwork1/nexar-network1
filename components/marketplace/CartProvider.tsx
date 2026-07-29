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
  addToCartAction,
  getCartStateAction,
  syncGuestCartAction,
} from "@/modules/cart/actions";
import type { CartLine } from "@/modules/cart/validators";
import { objectToFormData } from "@/utils/form-data";

const CART_SESSION_KEY = "nxr_cart_session";

function readGuestCart(): CartLine[] {
  try {
    const raw = sessionStorage.getItem(CART_SESSION_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items: CartLine[]) {
  sessionStorage.setItem(CART_SESSION_KEY, JSON.stringify(items));
}

function upsertGuestLine(items: CartLine[], productId: string, quantity: number): CartLine[] {
  const existing = items.find((item) => item.productId === productId);
  if (!existing) {
    return [...items, { productId, quantity }];
  }

  return items.map((item) =>
    item.productId === productId
      ? { ...item, quantity: item.quantity + quantity }
      : item
  );
}

type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  ready: boolean;
  isAuthenticated: boolean;
  addItem: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refresh: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const guestItems = readGuestCart();
      const state = await getCartStateAction();

      if (cancelled) return;

      if (state.authenticated) {
        if (guestItems.length > 0) {
          const merged = await syncGuestCartAction(guestItems);
          if (!cancelled) {
            setItems(merged);
            sessionStorage.removeItem(CART_SESSION_KEY);
          }
        } else {
          setItems(state.items);
        }
        setIsAuthenticated(true);
      } else {
        setItems(guestItems);
        setIsAuthenticated(false);
      }

      setReady(true);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items]
  );

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      if (isAuthenticated) {
        const result = await addToCartAction(
          objectToFormData({ productId, quantity })
        );

        if (!result.success) {
          toast.error(result.error ?? "Could not add to cart");
          return false;
        }

        setItems((current) => upsertGuestLine(current, productId, quantity));
        return true;
      }

      setItems((current) => {
        const next = upsertGuestLine(current, productId, quantity);
        writeGuestCart(next);
        return next;
      });
      return true;
    },
    [isAuthenticated]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      if (isAuthenticated) {
        toast.error("Open your cart to remove items while signed in.");
        return;
      }

      setItems((current) => {
        const next = current.filter((item) => item.productId !== productId);
        writeGuestCart(next);
        return next;
      });
    },
    [isAuthenticated]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (isAuthenticated) {
        toast.error("Open your cart to update quantities while signed in.");
        return;
      }

      if (quantity < 1) {
        await removeItem(productId);
        return;
      }

      setItems((current) => {
        const next = current.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        );
        writeGuestCart(next);
        return next;
      });
    },
    [isAuthenticated, removeItem]
  );

  const clearCart = useCallback(async () => {
    if (isAuthenticated) {
      toast.error("Open your cart to clear items while signed in.");
      return;
    }

    setItems([]);
    sessionStorage.removeItem(CART_SESSION_KEY);
  }, [isAuthenticated]);

  const refresh = useCallback(async () => {
    const state = await getCartStateAction();
    if (state.authenticated) {
      setItems(state.items);
      setIsAuthenticated(true);
    }
  }, []);

  const value = useMemo(
    () => ({
      items,
      itemCount,
      ready,
      isAuthenticated,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refresh,
    }),
    [items, itemCount, ready, isAuthenticated, addItem, updateQuantity, removeItem, clearCart, refresh]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}

export { CART_SESSION_KEY };
