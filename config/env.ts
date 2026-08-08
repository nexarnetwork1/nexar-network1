import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Next.js sets NODE_ENV=production during `next build` (compile/static phase).
 * Runtime production secrets are enforced when the deployed app actually runs,
 * not while collecting page data during compilation.
 */
function requiresRuntimeProductionSecrets(): boolean {
  if (process.env.NODE_ENV !== "production") return false;
  if (process.env.NEXT_PHASE === "phase-production-build") return false;
  return true;
}

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "staging", "production"])
      .default("development"),
    SUPABASE_SERVICE_ROLE_KEY: z
      .string()
      .min(1)
      .optional()
      .refine(
        (val) => !requiresRuntimeProductionSecrets() || Boolean(val),
        "SUPABASE_SERVICE_ROLE_KEY is required in production",
      ),
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    TREASURY_WALLET_PRIVATE_KEY: z.string().min(1).optional(),
    TREASURY_WALLET_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
    HD_WALLET_MNEMONIC: z.string().min(1).optional(),
    PAYMENT_MASTER_SEED: z.string().min(1).optional(),
    BSC_RPC_URL: z.string().url().optional(),
    CRON_SECRET: z
      .string()
      .min(1)
      .optional()
      .refine(
        (val) => !requiresRuntimeProductionSecrets() || Boolean(val),
        "CRON_SECRET is required in production",
      ),
    SUPER_ADMIN_SESSION_SECRET: z.string().min(32).optional(),
    AUTH_SECRET: z
      .string()
      .min(32)
      .optional()
      .refine(
        (val) => !requiresRuntimeProductionSecrets() || Boolean(val),
        "AUTH_SECRET is required in production (min 32 characters)",
      ),
    AUTH_URL: z.string().url().optional(),
    NEXTAUTH_URL: z.string().url().optional(),
    AUTH_GOOGLE_ID: z.string().min(1).optional(),
    AUTH_GOOGLE_SECRET: z.string().min(1).optional(),
    AUTH_GITHUB_ID: z.string().min(1).optional(),
    AUTH_GITHUB_SECRET: z.string().min(1).optional(),
    DATABASE_URL: z.string().url().optional(),
    SENTRY_DSN: z.string().url().optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().email().optional(),
    UPSTASH_REDIS_REST_URL: z
      .string()
      .url()
      .optional()
      .refine(
        (val) => !requiresRuntimeProductionSecrets() || Boolean(val),
        "UPSTASH_REDIS_REST_URL is required in production",
      ),
    UPSTASH_REDIS_REST_TOKEN: z
      .string()
      .min(1)
      .optional()
      .refine(
        (val) => !requiresRuntimeProductionSecrets() || Boolean(val),
        "UPSTASH_REDIS_REST_TOKEN is required in production",
      ),
    BOOTSTRAP_TOKEN: z.string().min(32).optional(),
    BETTERSTACK_HEARTBEAT_URL: z.string().url().optional(),
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
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1).optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
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
    AUTH_URL: process.env.AUTH_URL ?? process.env.NEXTAUTH_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? process.env.AUTH_URL,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID ?? process.env.GOOGLE_CLIENT_ID,
    AUTH_GOOGLE_SECRET:
      process.env.AUTH_GOOGLE_SECRET ?? process.env.GOOGLE_CLIENT_SECRET,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID ?? process.env.GITHUB_CLIENT_ID,
    AUTH_GITHUB_SECRET:
      process.env.AUTH_GITHUB_SECRET ?? process.env.GITHUB_CLIENT_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    SENTRY_DSN: process.env.SENTRY_DSN,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    BOOTSTRAP_TOKEN: process.env.BOOTSTRAP_TOKEN,
    BETTERSTACK_HEARTBEAT_URL: process.env.BETTERSTACK_HEARTBEAT_URL,
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
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED: process.env.NEXT_PUBLIC_OAUTH_GOOGLE_ENABLED,
    NEXT_PUBLIC_OAUTH_APPLE_ENABLED: process.env.NEXT_PUBLIC_OAUTH_APPLE_ENABLED,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  },
  skipValidation:
    process.env.SKIP_ENV_VALIDATION === "true" &&
    process.env.NODE_ENV !== "production",
  emptyStringAsUndefined: true,
});

export type AppEnvironment = typeof env.NODE_ENV;

export function isProduction(): boolean {
  return env.NODE_ENV === "production" && requiresRuntimeProductionSecrets();
}

export function isDevelopment(): boolean {
  return env.NODE_ENV === "development";
}
