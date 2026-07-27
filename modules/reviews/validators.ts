import { z } from "zod";

export const createProductReviewSchema = z.object({
  productId: z.string().uuid(),
  storeId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10).max(2000),
  images: z.array(z.string().url()).max(5).optional(),
});

export const createStoreReviewSchema = z.object({
  storeId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  body: z.string().min(10).max(2000),
  images: z.array(z.string().url()).max(5).optional(),
});

export const merchantReplySchema = z.object({
  reviewId: z.string().uuid(),
  reviewType: z.enum(["product", "store"]),
  reply: z.string().min(1).max(1000),
});
