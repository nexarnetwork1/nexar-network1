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
});

export const feeScheduleSchema = z.object({
  paymentType: z.enum(["nxr", "crypto_other", "card"]),
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

export type PlatformSettingsInput = z.infer<typeof platformSettingsSchema>;
export type FeeScheduleInput = z.infer<typeof feeScheduleSchema>;
export type ExchangeRateInput = z.infer<typeof exchangeRateSchema>;
