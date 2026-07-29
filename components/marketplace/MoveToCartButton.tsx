"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { moveWishlistToCartAction } from "@/modules/wishlist/actions";
import { useCart } from "@/components/marketplace/CartProvider";
import { useWishlist } from "@/components/marketplace/WishlistProvider";

type MoveToCartButtonProps = {
  productId: string;
  stock: number;
  className?: string;
};

export function MoveToCartButton({ productId, stock, className }: MoveToCartButtonProps) {
  const router = useRouter();
  const { refresh } = useCart();
  const { remove } = useWishlist();
  const [pending, setPending] = useState(false);

  async function handleMove() {
    if (stock < 1) {
      toast.error("Product is out of stock");
      return;
    }

    setPending(true);
    const result = await moveWishlistToCartAction(productId);
    setPending(false);

    if (!result.success) {
      toast.error(result.error ?? "Could not move to cart");
      return;
    }

    remove(productId);
    await refresh();
    toast.success("Moved to cart");
    router.refresh();
  }

  return (
    <Button
      type="button"
      onClick={() => void handleMove()}
      disabled={pending || stock < 1}
      className={className ?? "w-full"}
    >
      {pending ? "Moving…" : stock < 1 ? "Out of stock" : "Move to cart"}
    </Button>
  );
}
