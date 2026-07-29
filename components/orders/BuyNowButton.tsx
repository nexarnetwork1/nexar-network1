"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useZodForm } from "@/hooks/useZodForm";
import { addToCartSchema } from "@/modules/cart/validators";
import { buyNowAction } from "@/modules/orders/actions";
import { useCart } from "@/components/marketplace/CartProvider";
import type { ZodSchema } from "zod";
import { z } from "zod";

const schema = addToCartSchema;
type FormInput = z.infer<typeof schema>;

type BuyNowButtonProps = {
  productId: string;
  stock: number;
  loginNextPath?: string;
};

export function BuyNowButton({
  productId,
  stock,
  loginNextPath = "/customer/cart",
}: BuyNowButtonProps) {
  const router = useRouter();
  const { addItem, ready, isAuthenticated } = useCart();
  const [error, setError] = useState<string | null>(null);
  const [guestPending, setGuestPending] = useState(false);
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useZodForm<FormInput>({
    schema: schema as ZodSchema<FormInput>,
    defaultValues: { productId, quantity: 1 },
  });

  if (stock < 1) {
    return null;
  }

  async function onSubmit(data: FormInput) {
    if (!ready) return;
    setError(null);

    if (!isAuthenticated) {
      setGuestPending(true);
      const success = await addItem(data.productId, data.quantity);
      setGuestPending(false);

      if (!success) {
        setError("Could not add to cart");
        return;
      }

      window.location.href = `/login?next=${encodeURIComponent(loginNextPath)}`;
      return;
    }

    startTransition(async () => {
      const result = await buyNowAction(data.productId, data.quantity);
      if (result && !result.success) {
        setError(result.error ?? "Could not complete purchase");
        return;
      }
      router.refresh();
    });
  }

  const isPending = pending || guestPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex items-end gap-2" noValidate>
      <input type="hidden" {...register("productId")} />
      <Input
        {...register("quantity", { valueAsNumber: true })}
        type="number"
        min={1}
        max={Math.min(stock, 99)}
        label="Qty"
        className="w-20"
        error={errors.quantity?.message}
      />
      <Button type="submit" variant="secondary" disabled={isPending || !ready}>
        {isPending ? "Processing…" : "Buy now"}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
