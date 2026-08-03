"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCommerceAuth } from "@/components/commerce/auth/NexarCommerceAuthProvider";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import {
  removeCartItemAction,
  updateCartItemQuantityAction,
} from "@/modules/marketplace/cart";
import { CheckoutButton } from "@/components/orders/CheckoutButton";
import { Button } from "@/components/ui/Button";
import type { CartItemWithProduct } from "@/types";

type CartViewProps = {
  items: CartItemWithProduct[];
  isAuthenticated: boolean;
};

export function CartView({ items: initialItems, isAuthenticated }: CartViewProps) {
  const { openCommerceAuth } = useCommerceAuth();
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const subtotal = items.reduce(
    (sum, line) => sum + Number(line.product.price) * line.quantity,
    0,
  );
  const currency = items[0]?.product.currency ?? "USD";
  const storeIds = new Set(items.map((line) => line.product.store_id));

  function updateQuantity(cartItemId: string, quantity: number) {
    setError(null);
    startTransition(async () => {
      const result = await updateCartItemQuantityAction(cartItemId, quantity);
      if (!result.success) {
        setError(result.error ?? "Could not update cart");
        return;
      }
      if (quantity < 1) {
        setItems((prev) => prev.filter((line) => line.id !== cartItemId));
      } else {
        setItems((prev) =>
          prev.map((line) => (line.id === cartItemId ? { ...line, quantity } : line)),
        );
      }
    });
  }

  function removeItem(cartItemId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeCartItemAction(cartItemId);
      if (!result.success) {
        setError(result.error ?? "Could not remove item");
        return;
      }
      setItems((prev) => prev.filter((line) => line.id !== cartItemId));
    });
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-3xl border border-border/70 bg-card/60 p-10 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 text-gold/70" aria-hidden />
        <h2 className="mt-4 font-heading text-xl font-semibold text-white">Sign in to view your cart</h2>
        <p className="mt-2 text-sm text-muted">Your saved items and checkout are available after login.</p>
        <Button
          className="mt-6"
          onClick={() => openCommerceAuth({ mode: "signin", redirect: MARKETPLACE_ROUTES.cart })}
        >
          Sign in
        </Button>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-border/70 bg-card/60 p-10 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 text-gold/70" aria-hidden />
        <h2 className="mt-4 font-heading text-xl font-semibold text-white">Your cart is empty</h2>
        <p className="mt-2 text-sm text-muted">Discover products from verified merchants across the marketplace.</p>
        <Link href={MARKETPLACE_ROUTES.shop} className="mt-6 inline-block">
          <Button>Browse shop</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <ul className="space-y-4" aria-label="Cart items">
        {items.map((line) => {
          const handle = line.product.slug || line.product.id;
          const href = MARKETPLACE_ROUTES.product(handle);
          return (
            <li
              key={line.id}
              className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/60 p-4 sm:flex-row sm:items-center"
            >
              <Link href={href} className="shrink-0">
                <div className="h-24 w-24 overflow-hidden rounded-xl bg-surface">
                  {line.product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={line.product.image_url}
                      alt={line.product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gold/40">
                      {line.product.name.slice(0, 1)}
                    </div>
                  )}
                </div>
              </Link>

              <div className="min-w-0 flex-1">
                <Link href={href} className="font-heading text-base font-medium text-white hover:text-gold">
                  {line.product.name}
                </Link>
                <p className="mt-1 text-xs text-muted">{line.product.store?.name}</p>
                <p className="mt-2 font-mono text-gold">
                  {Number(line.product.price).toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                  })}{" "}
                  <span className="text-xs text-muted">{line.product.currency}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center rounded-full border border-border/70 bg-background/50">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={pending}
                    onClick={() => updateQuantity(line.id, line.quantity - 1)}
                    className="flex h-9 w-9 items-center justify-center text-muted hover:text-white"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="min-w-[2rem] text-center text-sm">{line.quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={pending}
                    onClick={() => updateQuantity(line.id, line.quantity + 1)}
                    className="flex h-9 w-9 items-center justify-center text-muted hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  aria-label="Remove item"
                  disabled={pending}
                  onClick={() => removeItem(line.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-muted hover:border-red-400/40 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-md">
        <h2 className="font-heading text-lg font-semibold text-white">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-muted">
            <dt>Items</dt>
            <dd>{items.reduce((n, line) => n + line.quantity, 0)}</dd>
          </div>
          <div className="flex justify-between text-muted">
            <dt>Stores</dt>
            <dd>{storeIds.size}</dd>
          </div>
          <div className="flex justify-between border-t border-border/60 pt-3 text-white">
            <dt className="font-medium">Subtotal</dt>
            <dd className="font-mono text-gold">
              {subtotal.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}{" "}
              {currency}
            </dd>
          </div>
        </dl>
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
        <div className="mt-6">
          <CheckoutButton />
        </div>
        <Link
          href={MARKETPLACE_ROUTES.shop}
          className="mt-4 block text-center text-sm text-muted hover:text-gold"
        >
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}
