import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

export const updateCartItemSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(99),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
