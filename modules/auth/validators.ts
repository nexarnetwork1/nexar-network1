import { z } from "zod";

const walletRegex = /^0x[a-fA-F0-9]{40}$/;

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const customerRegisterSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long"),
  walletAddress: z
    .string()
    .regex(walletRegex, "Invalid BSC wallet address (must be 0x + 40 hex chars)"),
});

export const merchantRegisterSchema = z.object({
  merchantName: z.string().min(2, "Merchant name required").max(100),
  storeName: z.string().min(2, "Store name required").max(100),
  businessType: z.string().min(2, "Business type required").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long"),
  walletAddress: z
    .string()
    .regex(walletRegex, "Invalid BSC wallet address"),
  mode: z.enum(["marketplace", "payments_only"]),
});

export const completeProfileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  walletAddress: z
    .string()
    .regex(walletRegex, "Invalid BSC wallet address"),
  role: z.enum(["customer", "merchant"]).optional(),
  storeName: z.string().min(2).max(100).optional(),
  businessType: z.string().min(2).max(100).optional(),
  mode: z.enum(["marketplace", "payments_only"]).optional(),
}).refine(
  (data) => {
    if (data.role === "merchant") {
      return data.storeName && data.businessType && data.mode;
    }
    return true;
  },
  { message: "Store name, business type, and mode are required for merchants" }
);

export type LoginInput = z.infer<typeof loginSchema>;
export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
export type MerchantRegisterInput = z.infer<typeof merchantRegisterSchema>;
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;
