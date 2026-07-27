"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/types";

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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const result = await action(new FormData(e.currentTarget));

    if (!result.success) {
      setError(result.error ?? "Failed to save product");
      setLoading(false);
      return;
    }

    if (result.redirectTo) {
      router.push(result.redirectTo);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <Input
        name="name"
        label="Product name"
        defaultValue={product?.name}
        required
      />
      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium text-muted">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={product?.description ?? ""}
          className="w-full rounded-xl border border-border bg-surface/80 px-4 py-3 text-sm text-white outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/20"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          name="price"
          type="number"
          step="0.01"
          min="0.01"
          label="Price"
          defaultValue={product?.price?.toString()}
          required
        />
        <Input
          name="currency"
          label="Currency"
          defaultValue={product?.currency ?? "USD"}
          maxLength={3}
          required
        />
      </div>
      <Input
        name="stock"
        type="number"
        min="0"
        label="Stock"
        defaultValue={product?.stock?.toString() ?? "0"}
        required
      />
      <div className="flex items-center gap-3">
        <input
          id="isActive"
          name="isActive"
          type="checkbox"
          value="true"
          defaultChecked={product?.is_active ?? true}
          className="h-4 w-4 rounded border-border accent-gold"
        />
        <label htmlFor="isActive" className="text-sm text-muted">
          Active (visible in marketplace)
        </label>
      </div>
      <div className="space-y-2">
        <label htmlFor="image" className="block text-sm font-medium text-muted">
          Product image {product?.image_url ? "(replace)" : ""}
        </label>
        {product?.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="mb-2 h-24 w-24 rounded-xl object-cover"
          />
        )}
        <input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-gold/10 file:px-4 file:py-2 file:text-sm file:text-gold"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
