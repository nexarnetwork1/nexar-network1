"use client";

import Link from "next/link";
import { CurrencyLogo } from "@/components/payments/CurrencyLogo";
import type { ProductWithStore } from "@/types";
import type { CartLine } from "@/modules/cart/validators";

type GuestCartItemRowProps = {
  line: CartLine & { product: ProductWithStore };
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
  updating?: boolean;
};

export function GuestCartItemRow({
  line,
  onQuantityChange,
  onRemove,
  updating,
}: GuestCartItemRowProps) {
  const lineTotal = Number(line.product.price) * line.quantity;

  return (
    <div className="flex gap-4 border-b border-border/50 py-6">
      {line.product.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={line.product.image_url}
          alt={line.product.name}
          className="h-20 w-20 rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-surface text-xs text-muted">
          No img
        </div>
      )}

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <Link
            href={`/store/${line.product.store.slug}`}
            className="flex items-center gap-2 text-xs text-muted hover:text-gold"
          >
            {line.product.store.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={line.product.store.logo_url} alt="" className="h-4 w-4 rounded-full object-cover" />
            )}
            {line.product.store.name}
          </Link>
          <Link
            href={`/marketplace/products/${line.product.id}`}
            className="font-medium hover:text-gold"
          >
            {line.product.name}
          </Link>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-gold">
            <CurrencyLogo code={line.product.currency} size={16} />
            {Number(line.product.price).toFixed(2)}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onQuantityChange(line.productId, Math.max(1, line.quantity - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:text-white disabled:opacity-40"
            disabled={updating || line.quantity <= 1}
          >
            −
          </button>
          <span className="w-8 text-center text-sm">{line.quantity}</span>
          <button
            type="button"
            onClick={() =>
              onQuantityChange(
                line.productId,
                Math.min(line.product.stock, line.quantity + 1)
              )
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:text-white disabled:opacity-40"
            disabled={updating || line.quantity >= line.product.stock}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => onRemove(line.productId)}
            className="ml-auto text-sm text-red-400 hover:text-red-300"
            disabled={updating}
          >
            Remove
          </button>
        </div>
      </div>

      <div className="text-right">
        <p className="flex items-center justify-end gap-1 font-medium">
          <CurrencyLogo code={line.product.currency} size={16} showLabel={false} />
          {lineTotal.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
