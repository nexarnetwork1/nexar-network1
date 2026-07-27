"use client";

import { useState, useTransition } from "react";
import type { CartItemWithProduct } from "@/types";
import { calculateCartTotals } from "@/modules/cart/totals";
import { validateCartCouponAction } from "@/modules/cart/actions";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";
import { CheckoutButton } from "@/components/orders/CheckoutButton";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Props = {
  items: CartItemWithProduct[];
  storeCount: number;
};

export function CartOrderSummary({ items, storeCount }: Props) {
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const totals = calculateCartTotals(items, {
    couponCode: couponDiscount > 0 ? couponCode : null,
    couponDiscount,
  });

  function applyCoupon() {
    if (!couponCode.trim()) return;
    startTransition(async () => {
      const result = await validateCartCouponAction(couponCode, totals.subtotal);
      if (!result.success) {
        setCouponDiscount(0);
        setCouponMessage(result.error ?? "Invalid coupon");
        return;
      }
      setCouponDiscount(result.discountUsd ?? 0);
      setCouponMessage(result.message ?? "Coupon applied");
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-6">
      <h2 className="font-heading text-lg font-semibold">Order summary</h2>

      <div className="mt-4 space-y-3">
        <div className="flex gap-2">
          <Input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Coupon code"
            className="flex-1"
          />
          <Button type="button" variant="secondary" disabled={pending} onClick={applyCoupon}>
            Apply
          </Button>
        </div>
        {couponMessage && (
          <p className={`text-xs ${couponDiscount > 0 ? "text-emerald-400" : "text-red-400"}`}>
            {couponMessage}
          </p>
        )}
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <CurrencyAmount
            amount={totals.subtotal}
            currency={totals.currency}
            size={16}
            amountClassName="font-medium"
          />
        </div>
        <div className="flex justify-between text-muted">
          <span>Platform fees</span>
          <span>At checkout</span>
        </div>
        {totals.adjustments.map((adj) => (
          <div key={adj.type} className="flex justify-between text-muted">
            <span>{adj.label}</span>
            <span>
              {adj.applied ? (
                adj.type === "coupon" ? (
                  <>−<CurrencyAmount amount={adj.amount} currency={totals.currency} size={14} showCode={false} /></>
                ) : (
                  <CurrencyAmount amount={adj.amount} currency={totals.currency} size={14} />
                )
              ) : (
                adj.note ?? "—"
              )}
            </span>
          </div>
        ))}
        <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
          <span>Grand total</span>
          <CurrencyAmount
            amount={totals.grandTotal}
            currency={totals.currency}
            size={16}
            amountClassName="font-semibold"
          />
        </div>
      </div>

      {storeCount > 1 && (
        <p className="mt-3 text-xs text-muted">
          Checkout creates {storeCount} separate orders (one per store).
        </p>
      )}

      <div className="mt-6">
        <CheckoutButton />
      </div>
    </div>
  );
}
