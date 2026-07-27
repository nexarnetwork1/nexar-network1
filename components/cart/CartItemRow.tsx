"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { updateCartItemAction, removeCartItemAction } from "@/modules/cart/actions";
import type { CartItemWithProduct } from "@/types";

type CartItemRowProps = {
  item: CartItemWithProduct;
};

export function CartItemRow({ item }: CartItemRowProps) {
  const router = useRouter();

  async function handleQuantityChange(newQty: number) {
    const formData = new FormData();
    formData.set("itemId", item.id);
    formData.set("quantity", String(newQty));
    await updateCartItemAction(formData);
    router.refresh();
  }

  async function handleRemove() {
    await removeCartItemAction(item.id);
    router.refresh();
  }

  const lineTotal = Number(item.product.price) * item.quantity;

  return (
    <div className="flex gap-4 border-b border-border/50 py-6">
      {item.product.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.product.image_url}
          alt={item.product.name}
          className="h-20 w-20 rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-surface text-xs text-muted">
          No img
        </div>
      )}

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <p className="text-xs text-muted">{item.product.store.name}</p>
          <h3 className="font-medium">{item.product.name}</h3>
          <p className="mt-1 text-sm text-gold">
            {item.product.currency} {Number(item.product.price).toFixed(2)}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleQuantityChange(Math.max(1, item.quantity - 1))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:text-white"
            disabled={item.quantity <= 1}
          >
            −
          </button>
          <span className="w-8 text-center text-sm">{item.quantity}</span>
          <button
            type="button"
            onClick={() =>
              handleQuantityChange(
                Math.min(item.product.stock, item.quantity + 1)
              )
            }
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted hover:text-white"
            disabled={item.quantity >= item.product.stock}
          >
            +
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="ml-auto text-sm text-red-400 hover:text-red-300"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="text-right">
        <p className="font-medium">
          {item.product.currency} {lineTotal.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
