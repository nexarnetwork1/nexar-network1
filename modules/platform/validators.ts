import { z } from "zod";
import { walletConfig } from "@/config/wallet";

export const platformSettingsSchema = z.object({
  treasuryWallet: z
    .union([
      z.literal(""),
      z.string().regex(walletConfig.addressPattern, "Invalid treasury wallet address"),
    ])
    .optional(),
  supportEmail: z.string().email("Invalid support email"),
  nxrToken: z.string().optional(),
  usdtToken: z.string().optional(),
  maintenanceMode: z.coerce.boolean().optional(),
  platformStatus: z.enum(["operational", "degraded", "maintenance"]).optional(),
  minPaymentUsd: z.coerce.number().positive().optional(),
  maxPaymentUsd: z.coerce.number().positive().optional(),
  emailNotificationsEnabled: z.coerce.boolean().optional(),
  telegramNotificationsEnabled: z.coerce.boolean().optional(),
  merchantPromotionDiscountPercent: z.coerce.number().min(0).max(1).optional(),
  merchantPromotionDurationDays: z.coerce.number().int().min(1).max(365).optional(),
});

export const feeScheduleSchema = z.object({
  paymentType: z.enum([
    "nxr",
    "crypto_other",
    "card",
    "visa",
    "mastercard",
    "apple_pay",
    "google_pay",
  ]),
  baseRate: z.coerce.number().min(0, "Rate must be positive").max(1, "Rate cannot exceed 100%"),
});

export const exchangeRateSchema = z.object({
  baseCurrency: z.enum(["BNB", "NXR", "USDT", "BTC", "ETH"]),
  rate: z.coerce.number().positive("Rate must be greater than 0"),
});

export const storeStatusSchema = z.object({
  storeId: z.string().uuid(),
  status: z.enum(["pending", "active", "suspended"]),
});

export const userRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["customer", "merchant", "admin"]),
});

export const productModerationSchema = z.object({
  productId: z.string().uuid(),
  isActive: z.coerce.boolean(),
});

export const currencyToggleSchema = z.object({
  currencyId: z.string().uuid(),
  isActive: z.coerce.boolean(),
});

export const createPromotionSchema = z.object({
  storeId: z.string().uuid(),
  discountPercent: z.coerce.number().min(1).max(100),
  months: z.coerce.number().int().min(1).max(12).default(3),
});

export const banUserSchema = z.object({
  userId: z.string().uuid(),
  ban: z.coerce.boolean(),
});

export type ProductModerationInput = z.infer<typeof productModerationSchema>;
export type CurrencyToggleInput = z.infer<typeof currencyToggleSchema>;
export type CreatePromotionInput = z.infer<typeof createPromotionSchema>;

export type PlatformSettingsInput = z.infer<typeof platformSettingsSchema>;
export type FeeScheduleInput = z.infer<typeof feeScheduleSchema>;
export type ExchangeRateInput = z.infer<typeof exchangeRateSchema>;
