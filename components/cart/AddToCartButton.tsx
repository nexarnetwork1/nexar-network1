"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { addToCartAction } from "@/modules/cart/actions";

type AddToCartButtonProps = {
  productId: string;
  stock: number;
  disabled?: boolean;
};

export function AddToCartButton({ productId, stock, disabled }: AddToCartButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (stock < 1) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("productId", productId);
    formData.set("quantity", "1");

    const result = await addToCartAction(formData);

    if (!result.success) {
      setError(result.error ?? "Failed to add to cart");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div>
      <Button
        type="button"
        onClick={handleAdd}
        disabled={disabled || loading || stock < 1}
      >
        {stock < 1 ? "Out of stock" : loading ? "Adding…" : "Add to cart"}
      </Button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
