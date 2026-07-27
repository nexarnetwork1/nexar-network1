"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useZodForm } from "@/hooks/useZodForm";
import { addToCartSchema } from "@/modules/cart/validators";
import { buyNowAction } from "@/modules/orders/actions";
import type { ZodSchema } from "zod";
import { z } from "zod";

const schema = addToCartSchema;
type FormInput = z.infer<typeof schema>;

type BuyNowButtonProps = {
  productId: string;
  stock: number;
};

export function BuyNowButton({ productId, stock }: BuyNowButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
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

  function onSubmit(data: FormInput) {
    setError(null);
    startTransition(async () => {
      const result = await buyNowAction(data.productId, data.quantity);
      if (result && !result.success) {
        setError(result.error ?? "Could not complete purchase");
        return;
      }
      router.refresh();
    });
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
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Processing…" : "Buy now"}
      </Button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
