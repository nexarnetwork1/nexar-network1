import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "staging", "production"])
      .default("development"),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    TREASURY_WALLET_PRIVATE_KEY: z.string().min(1).optional(),
    HD_WALLET_MNEMONIC: z.string().min(1).optional(),
    PAYMENT_MASTER_SEED: z.string().min(1).optional(),
    BSC_RPC_URL: z.string().url().optional(),
    CRON_SECRET: z.string().min(1).optional(),
    SENTRY_DSN: z.string().url().optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().email().optional(),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    ADMIN_ALERT_WEBHOOK_URL: z.string().url().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_BSC_RPC_URL: z.string().url().optional(),
    NEXT_PUBLIC_NXR_TOKEN_ADDRESS: z.string().optional(),
    NEXT_PUBLIC_USDT_TOKEN_ADDRESS: z.string().optional(),
    NEXT_PUBLIC_TREASURY_WALLET_ADDRESS: z.string().optional(),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    TREASURY_WALLET_PRIVATE_KEY: process.env.TREASURY_WALLET_PRIVATE_KEY,
    HD_WALLET_MNEMONIC: process.env.HD_WALLET_MNEMONIC,
    PAYMENT_MASTER_SEED: process.env.PAYMENT_MASTER_SEED,
    BSC_RPC_URL: process.env.BSC_RPC_URL,
    CRON_SECRET: process.env.CRON_SECRET,
    SENTRY_DSN: process.env.SENTRY_DSN,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    LOG_LEVEL: process.env.LOG_LEVEL,
    ADMIN_ALERT_WEBHOOK_URL: process.env.ADMIN_ALERT_WEBHOOK_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_BSC_RPC_URL: process.env.NEXT_PUBLIC_BSC_RPC_URL,
    NEXT_PUBLIC_NXR_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_NXR_TOKEN_ADDRESS,
    NEXT_PUBLIC_USDT_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_USDT_TOKEN_ADDRESS,
    NEXT_PUBLIC_TREASURY_WALLET_ADDRESS:
      process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  emptyStringAsUndefined: true,
});

export type AppEnvironment = typeof env.NODE_ENV;

export function isProduction(): boolean {
  return env.NODE_ENV === "production";
}

export function isDevelopment(): boolean {
  return env.NODE_ENV === "development";
}
