"use client";

import Link from "next/link";
import type { CartTotals } from "@/modules/cart/totals";
import { CurrencyAmount } from "@/components/payments/CurrencyAmount";
import { Button } from "@/components/ui/Button";

type GuestCartOrderSummaryProps = {
  totals: CartTotals;
  itemCount: number;
  storeCount: number;
};

export function GuestCartOrderSummary({
  totals,
  itemCount,
  storeCount,
}: GuestCartOrderSummaryProps) {
  return (
    <aside className="rounded-2xl border border-border bg-card/30 p-6">
      <h2 className="font-heading text-lg font-semibold">Order summary</h2>
      <p className="mt-2 text-sm text-muted">
        {itemCount} item{itemCount === 1 ? "" : "s"} from {storeCount} store
        {storeCount === 1 ? "" : "s"}
      </p>

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
        {totals.adjustments.map((adjustment) => (
          <div key={adjustment.type} className="flex justify-between text-muted">
            <span>{adjustment.label}</span>
            <span>
              {adjustment.applied ? (
                adjustment.type === "coupon" ? (
                  <>
                    −
                    <CurrencyAmount
                      amount={adjustment.amount}
                      currency={totals.currency}
                      size={14}
                      showCode={false}
                    />
                  </>
                ) : (
                  <CurrencyAmount
                    amount={adjustment.amount}
                    currency={totals.currency}
                    size={14}
                  />
                )
              ) : (
                adjustment.note ?? "—"
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

      <p className="mt-3 text-xs text-muted">
        Shipping, tax, and discounts are finalized after you sign in and checkout.
      </p>

      {storeCount > 1 && (
        <p className="mt-3 text-xs text-muted">
          Checkout creates {storeCount} separate orders (one per store).
        </p>
      )}

      <Link href={`/login?next=${encodeURIComponent("/customer/cart")}`} className="mt-6 block">
        <Button className="w-full">Sign in to checkout</Button>
      </Link>
      <Link href="/marketplace/browse" className="mt-3 block">
        <Button variant="secondary" className="w-full">
          Continue shopping
        </Button>
      </Link>
    </aside>
  );
}
