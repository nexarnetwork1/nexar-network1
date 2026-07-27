import { z } from "zod";
import { walletConfig } from "@/config/wallet";

export const walletAddressSchema = z
  .string()
  .regex(walletConfig.addressPattern, "Invalid BSC wallet address");

export const emailSchema = z.string().email("Invalid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password too long");

export const uuidSchema = z.string().uuid("Invalid ID");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export const idParamSchema = z.object({
  id: uuidSchema,
});
