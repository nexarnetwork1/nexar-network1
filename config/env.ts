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
    TREASURY_WALLET_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
    HD_WALLET_MNEMONIC: z.string().min(1).optional(),
    PAYMENT_MASTER_SEED: z.string().min(1).optional(),
    BSC_RPC_URL: z.string().url().optional(),
    CRON_SECRET: z.string().min(1).optional(),
    SUPER_ADMIN_SESSION_SECRET: z.string().min(32).optional(),
    AUTH_SECRET: z.string().min(32).optional(),
    AUTH_GOOGLE_ID: z.string().min(1).optional(),
    AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
    DATABASE_URL: z.string().url().optional(),
    SENTRY_DSN: z.string().url().optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().email().optional(),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    ADMIN_ALERT_WEBHOOK_URL: z.string().url().optional(),
    OPENAI_API_KEY: z.string().min(1).optional(),
    OPENAI_MODEL: z.string().min(1).optional(),
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
    NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED: z.enum(["true", "false"]).optional(),
    NEXT_PUBLIC_OAUTH_APPLE_ENABLED: z.enum(["true", "false"]).optional(),
    /** GA4 measurement ID. Analytics stays off entirely when unset. */
    NEXT_PUBLIC_GA_MEASUREMENT_ID: z
      .string()
      .regex(/^G-[A-Z0-9]+$/, "Must be a GA4 measurement ID, e.g. G-XXXXXXXXXX")
      .optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    TREASURY_WALLET_PRIVATE_KEY: process.env.TREASURY_WALLET_PRIVATE_KEY,
    TREASURY_WALLET_ADDRESS: process.env.TREASURY_WALLET_ADDRESS,
    HD_WALLET_MNEMONIC: process.env.HD_WALLET_MNEMONIC,
    PAYMENT_MASTER_SEED: process.env.PAYMENT_MASTER_SEED,
    BSC_RPC_URL: process.env.BSC_RPC_URL,
    CRON_SECRET: process.env.CRON_SECRET,
    SUPER_ADMIN_SESSION_SECRET: process.env.SUPER_ADMIN_SESSION_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID,
    AUTH_GOOGLE_SECRET:
      process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    LOG_LEVEL: process.env.LOG_LEVEL,
    ADMIN_ALERT_WEBHOOK_URL: process.env.ADMIN_ALERT_WEBHOOK_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_BSC_RPC_URL: process.env.NEXT_PUBLIC_BSC_RPC_URL,
    NEXT_PUBLIC_NXR_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_NXR_TOKEN_ADDRESS,
    NEXT_PUBLIC_USDT_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_USDT_TOKEN_ADDRESS,
    NEXT_PUBLIC_TREASURY_WALLET_ADDRESS:
      process.env.NEXT_PUBLIC_TREASURY_WALLET_ADDRESS,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED: process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED,
    NEXT_PUBLIC_OAUTH_APPLE_ENABLED: process.env.NEXT_PUBLIC_OAUTH_APPLE_ENABLED,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
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
