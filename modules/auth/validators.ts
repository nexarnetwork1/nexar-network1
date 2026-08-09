import { z } from "zod";

const walletRegex = /^0x[a-fA-F0-9]{40}$/;

const optionalWalletAddress = z
  .union([
    z.literal(""),
    z.string().regex(walletRegex, "Invalid BSC wallet address (must be 0x + 40 hex chars)"),
  ])
  .optional()
  .transform((value) => (value ? value : undefined));

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const customerRegisterSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  username: z
    .string()
    .min(2, "Username must be at least 2 characters")
    .max(30, "Username too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username may only contain letters, numbers, _ and -"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long"),
  walletAddress: optionalWalletAddress,
});

/** Client form schema — adds confirm password; submits via customerRegisterSchema fields. */
export const atlasRegisterFormSchema = customerRegisterSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
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

const optionalText = z
  .string()
  .optional()
  .transform((value) => (value?.trim() ? value.trim() : undefined));

export const completeProfileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  username: optionalText.pipe(z.string().min(2).max(32).optional()),
  walletAddress: z
    .string()
    .optional()
    .transform((value) => (value?.trim() ? value.trim() : undefined))
    .refine((value) => !value || walletRegex.test(value), "Invalid BSC wallet address"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CustomerRegisterInput = z.infer<typeof customerRegisterSchema>;
export type AtlasRegisterFormInput = z.infer<typeof atlasRegisterFormSchema>;
export type MerchantRegisterInput = z.infer<typeof merchantRegisterSchema>;
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password too long"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Name required").max(100),
  singleSession: z.coerce.boolean().optional(),
});

export const changeEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password required to change email"),
});

export const changeWalletSchema = z.object({
  walletAddress: z
    .string()
    .regex(walletRegex, "Invalid BSC wallet address"),
  confirmWalletAddress: z.string(),
  password: z.string().min(8, "Password required to change wallet"),
}).refine((data) => data.walletAddress === data.confirmWalletAddress, {
  message: "Wallet addresses do not match",
  path: ["confirmWalletAddress"],
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
export type ChangeWalletInput = z.infer<typeof changeWalletSchema>;
