"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { resolveCartProductsAction } from "@/modules/cart/actions";
import { useCart } from "@/components/marketplace/CartProvider";
import { GuestCartItemRow } from "@/components/cart/GuestCartItemRow";
import { Button } from "@/components/ui/Button";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";
import type { ProductWithStore } from "@/types";
import type { CartLine } from "@/modules/cart/validators";

type ResolvedLine = CartLine & { product: ProductWithStore };

export function MarketplaceCartClient() {
  const { items, ready, updateQuantity, removeItem, clearCart } = useCart();
  const [resolved, setResolved] = useState<ResolvedLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      const products = await resolveCartProductsAction(items);
      if (!cancelled) {
        setResolved(products);
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [items, ready]);

  const subtotal = useMemo(
    () =>
      resolved.reduce(
        (total, line) => total + Number(line.product.price) * line.quantity,
        0
      ),
    [resolved]
  );

  const currency = resolved[0]?.product.currency ?? "USD";
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  if (!ready || loading) {
    return <p className="mt-8 text-muted">Loading cart…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="mt-12 rounded-2xl border border-border bg-card/40 p-12 text-center">
        <p className="text-muted">Your cart is empty.</p>
        <Link href="/marketplace/browse" className="mt-4 inline-block">
          <Button variant="secondary">Browse marketplace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <section className="rounded-2xl border border-border bg-card/20 p-6">
          {resolved.map((line) => (
            <GuestCartItemRow
              key={line.productId}
              line={line}
              onQuantityChange={(productId, quantity) => void updateQuantity(productId, quantity)}
              onRemove={(productId) => void removeItem(productId)}
            />
          ))}
        </section>
        <Button type="button" variant="ghost" onClick={() => void clearCart()}>
          Clear cart
        </Button>
      </div>

      <aside className="rounded-2xl border border-border bg-card/30 p-6">
        <h2 className="font-heading text-lg font-semibold">Order summary</h2>
        <p className="mt-2 text-sm text-muted">
          {itemCount} item{itemCount === 1 ? "" : "s"}
        </p>
        <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
          <span className="text-muted">Subtotal</span>
          <CurrencyAmount amount={subtotal} currency={currency} size={18} />
        </div>
        <p className="mt-4 text-xs text-muted">
          Sign in to checkout. Shipping, fees, and discounts are calculated at checkout.
        </p>
        <Link href={`/login?next=${encodeURIComponent("/customer/cart")}`} className="mt-6 block">
          <Button className="w-full">Sign in to checkout</Button>
        </Link>
        <Link href="/marketplace/browse" className="mt-3 block">
          <Button variant="secondary" className="w-full">
            Continue shopping
          </Button>
        </Link>
      </aside>
    </div>
  );
}
