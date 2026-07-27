import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  description: z.string().max(5000).optional(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  currency: z.string().length(3).default("USD"),
  stock: z.coerce.number().int().min(0, "Stock cannot be negative"),
  isActive: z.coerce.boolean().default(true),
  categoryId: z.string().optional(),
});

export const productCategorySchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
});

export const productSearchSchema = z.object({
  q: z.string().max(200).optional(),
  storeSlug: z.string().max(100).optional(),
  categorySlug: z.string().max(100).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "name"]).default("newest"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type ProductInput = z.infer<typeof productSchema>;
export type ProductCategoryInput = z.infer<typeof productCategorySchema>;
export type ProductSearchInput = z.infer<typeof productSearchSchema>;
