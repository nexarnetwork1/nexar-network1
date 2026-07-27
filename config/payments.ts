import { env } from "./env";

export const paymentsConfig = {
  methods: ["crypto", "card"] as const,
  sessionExpiryMinutes: 30,
  stripe: {
    publishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null,
    secretKey: env.STRIPE_SECRET_KEY ?? null,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET ?? null,
  },
  crypto: {
    supportedCurrencies: ["BNB", "NXR", "USDT"] as const,
  },
} as const;

export type PaymentMethodType = (typeof paymentsConfig.methods)[number];
