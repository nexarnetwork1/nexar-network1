"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useZodForm } from "@/hooks/useZodForm";
import { addToCartSchema } from "@/modules/cart/validators";
import { useCart } from "@/components/marketplace/CartProvider";
import type { ZodSchema } from "zod";
import { z } from "zod";

const addToCartFormSchema = addToCartSchema;
type AddToCartFormInput = z.infer<typeof addToCartFormSchema>;

type AddToCartButtonProps = {
  productId: string;
  stock: number;
  disabled?: boolean;
  showQuantity?: boolean;
};

export function AddToCartButton({
  productId,
  stock,
  disabled,
  showQuantity = false,
}: AddToCartButtonProps) {
  const router = useRouter();
  const { addItem, ready, isAuthenticated } = useCart();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useZodForm<AddToCartFormInput>({
    schema: addToCartFormSchema as ZodSchema<AddToCartFormInput>,
    defaultValues: { productId, quantity: 1 },
  });

  async function onSubmit(data: AddToCartFormInput) {
    if (stock < 1 || !ready) return;
    setServerError(null);
    setIsSubmitting(true);

    const success = await addItem(data.productId, data.quantity);

    setIsSubmitting(false);

    if (!success) {
      setServerError("Failed to add to cart");
      return;
    }

    if (isAuthenticated) {
      router.refresh();
    } else {
      toast.success("Added to cart", {
        action: {
          label: "View cart",
          onClick: () => {
            window.location.href = "/marketplace/cart";
          },
        },
      });
    }
  }

  if (stock < 1) {
    return (
      <Button type="button" disabled>
        Out of stock
      </Button>
    );
  }

  if (!showQuantity) {
    async function handleQuickAdd() {
      await onSubmit({ productId, quantity: 1 });
    }

    return (
      <div>
        <Button
          type="button"
          onClick={handleQuickAdd}
          disabled={disabled || isSubmitting || !ready}
        >
          {isSubmitting ? "Adding…" : "Add to cart"}
        </Button>
        {serverError && <p className="mt-2 text-sm text-red-400">{serverError}</p>}
      </div>
    );
  }

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
      <Button type="submit" disabled={disabled || isSubmitting || !ready}>
        {isSubmitting ? "Adding…" : "Add to cart"}
      </Button>
      {serverError && <p className="text-sm text-red-400">{serverError}</p>}
    </form>
  );
}
