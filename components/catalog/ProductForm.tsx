"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { ImageDropzone } from "@/components/catalog/ImageDropzone";
import { useZodForm } from "@/hooks/useZodForm";
import { productSchema, type ProductInput } from "@/modules/catalog/validators";
import { objectToFormData } from "@/utils/form-data";
import type { Product } from "@/types";
import type { ZodSchema } from "zod";

type ProductFormProps = {
  action: (formData: FormData) => Promise<{ success: boolean; error?: string; redirectTo?: string }>;
  product?: Product;
  submitLabel?: string;
};

export function ProductForm({
  action,
  product,
  submitLabel = "Save product",
}: ProductFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useZodForm<ProductInput>({
    schema: productSchema as ZodSchema<ProductInput>,
    defaultValues: {
      name: product?.name ?? "",
      description: product?.description ?? "",
      price: product?.price ?? 0,
      currency: product?.currency ?? "USD",
      stock: product?.stock ?? 0,
      isActive: product?.is_active ?? true,
    },
  });

  async function onSubmit(data: ProductInput) {
    setServerError(null);

    const formData = objectToFormData(data);
    if (imageFile) formData.set("image", imageFile);

    const result = await action(formData);

    if (!result.success) {
      setServerError(result.error ?? "Failed to save product");
      return;
    }

    if (result.redirectTo) {
      router.push(result.redirectTo);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4" noValidate>
      <Input
        {...register("name")}
        label="Product name"
        error={errors.name?.message}
      />
      <Textarea
        {...register("description")}
        label="Description"
        rows={4}
        error={errors.description?.message}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          {...register("price", { valueAsNumber: true })}
          type="number"
          step="0.01"
          min="0.01"
          label="Price"
          error={errors.price?.message}
        />
        <Input
          {...register("currency")}
          label="Currency"
          maxLength={3}
          error={errors.currency?.message}
        />
      </div>
      <Input
        {...register("stock", { valueAsNumber: true })}
        type="number"
        min="0"
        label="Stock"
        error={errors.stock?.message}
      />
      <div className="flex items-center gap-3">
        <input
          id="isActive"
          type="checkbox"
          className="h-4 w-4 rounded border-border accent-gold"
          {...register("isActive")}
        />
        <label htmlFor="isActive" className="text-sm text-muted">
          Active (visible in marketplace when store is approved)
        </label>
      </div>

      <ImageDropzone
        onFileChange={setImageFile}
        currentImageUrl={product?.image_url}
        label={product?.image_url ? "Replace product image" : "Product image"}
      />

      {serverError && <p className="text-sm text-red-400">{serverError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
