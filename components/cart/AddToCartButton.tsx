"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useZodForm } from "@/hooks/useZodForm";
import { addToCartSchema } from "@/modules/cart/validators";
import { addToCartAction } from "@/modules/cart/actions";
import { objectToFormData } from "@/utils/form-data";
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
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm<AddToCartFormInput>({
    schema: addToCartFormSchema as ZodSchema<AddToCartFormInput>,
    defaultValues: { productId, quantity: 1 },
  });

  async function onSubmit(data: AddToCartFormInput) {
    if (stock < 1) return;
    setServerError(null);

    const result = await addToCartAction(objectToFormData(data));

    if (!result.success) {
      setServerError(result.error ?? "Failed to add to cart");
      return;
    }

    router.refresh();
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
          disabled={disabled || isSubmitting}
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
      <Button type="submit" disabled={disabled || isSubmitting}>
        {isSubmitting ? "Adding…" : "Add to cart"}
      </Button>
      {serverError && <p className="text-sm text-red-400">{serverError}</p>}
    </form>
  );
}
