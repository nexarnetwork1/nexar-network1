"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { resolveCartProductsAction } from "@/modules/cart/actions";
import { calculateCartTotals } from "@/modules/cart/totals";
import { useCart } from "@/components/marketplace/CartProvider";
import { GuestCartItemRow } from "@/components/cart/GuestCartItemRow";
import { GuestCartOrderSummary } from "@/components/cart/GuestCartOrderSummary";
import { Button } from "@/components/ui/Button";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";
import { groupGuestCartLinesByStore, type GuestCartLine } from "@/utils/cart";

export function MarketplaceCartClient() {
  const { items, ready, updateQuantity, removeItem, clearCart } = useCart();
  const [resolved, setResolved] = useState<GuestCartLine[]>([]);
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

  const storeGroups = useMemo(() => groupGuestCartLinesByStore(resolved), [resolved]);
  const totals = useMemo(() => calculateCartTotals(resolved), [resolved]);
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
      <div className="space-y-8 lg:col-span-2">
        {storeGroups.map((group) => (
          <section
            key={group.storeId}
            className="rounded-2xl border border-border bg-card/20 p-6"
          >
            <h2 className="font-heading text-lg font-semibold">{group.storeName}</h2>
            <p className="mt-1 text-sm text-muted">
              Store subtotal:{" "}
              <CurrencyAmount amount={group.subtotal} currency={totals.currency} size={16} />
            </p>
            <div className="mt-4">
              {group.items.map((line) => (
                <GuestCartItemRow
                  key={line.productId}
                  line={line}
                  onQuantityChange={(productId, quantity) => void updateQuantity(productId, quantity)}
                  onRemove={(productId) => void removeItem(productId)}
                />
              ))}
            </div>
          </section>
        ))}
        <Button type="button" variant="ghost" onClick={() => void clearCart()}>
          Clear cart
        </Button>
      </div>

      <GuestCartOrderSummary
        totals={totals}
        itemCount={itemCount}
        storeCount={storeGroups.length}
      />
    </div>
  );
}
