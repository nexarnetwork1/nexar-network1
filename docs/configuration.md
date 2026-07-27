# Configuration Plan

All configuration is centralized in `config/` with type-safe environment validation via `@t3-oss/env-nextjs`.

## Environment Files

| File | Purpose |
|---|---|
| `.env.example` | Development template |
| `.env.staging.example` | Staging deployment template |
| `.env.production.example` | Production deployment template |
| `.env.local` | Local overrides (gitignored) |

Copy the appropriate example file and fill in values. Never commit secrets.

## Environment Validation

`config/env.ts` validates all environment variables at build/runtime:

```ts
import { env } from "@/config/env";

const url = env.NEXT_PUBLIC_SUPABASE_URL; // typed, validated
```

Set `SKIP_ENV_VALIDATION=true` only for CI builds without full env.

## Configuration Modules

| Module | File | Exports |
|---|---|---|
| Environment | `config/env.ts` | `env`, `isProduction()`, `isDevelopment()` |
| Supabase | `config/supabase.ts` | `supabaseConfig` |
| Authentication | `config/auth.ts` | `authConfig`, providers, routes |
| Wallet | `config/wallet.ts` | `walletConfig`, chain IDs, address pattern |
| Treasury | `config/treasury.ts` | `treasuryConfig`, server-only key refs |
| Blockchain | `config/blockchain.ts` | `blockchainConfig`, tokens, confirmations |
| Payments | `config/payments.ts` | `paymentsConfig`, Stripe, crypto currencies |
| Exchange Rates | `config/exchange-rates.ts` | `exchangeRatesConfig`, cache TTL |
| Platform Fees | `config/platform-fees.ts` | `platformFeesConfig`, default rates |
| Merchant Promotions | `config/merchant-promotions.ts` | `merchantPromotionsConfig`, limits |
| Security | `config/security.ts` | `securityConfig`, CSRF, rate limits, routes |
| Logging | `config/logging.ts` | `loggingConfig`, levels, audit settings |
| Email | `config/email.ts` | `emailConfig`, provider, templates |
| Notifications | `config/notifications.ts` | `notificationsConfig`, channels, events |

Import from the barrel:

```ts
import { blockchainConfig, paymentsConfig } from "@/config";
```

## Secret Handling

| Variable | Exposure | Notes |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Admin client, bypasses RLS |
| `TREASURY_WALLET_PRIVATE_KEY` | Server only | Settlement signing |
| `HD_WALLET_MNEMONIC` | Server only | Deposit address derivation |
| `STRIPE_SECRET_KEY` | Server only | Payment processing |
| `STRIPE_WEBHOOK_SECRET` | Server only | Webhook verification |
| `RESEND_API_KEY` | Server only | Email sending |
| `SENTRY_DSN` | Server only | Error monitoring |
| `NEXT_PUBLIC_*` | Client safe | Only non-sensitive values |

## Per-Environment Differences

| Setting | Development | Staging | Production |
|---|---|---|---|
| `LOG_LEVEL` | `debug` | `info` | `warn` |
| `SKIP_ENV_VALIDATION` | `false` | `false` | `false` |
| BSC confirmations | 1 | 3 | 12 |
| Sentry enabled | No | Yes | Yes |
| Console logging | Yes | Yes | No |

## Deployment Checklist

1. Copy environment example for target environment
2. Set all required `NEXT_PUBLIC_*` variables
3. Set all server secrets via platform secret manager
4. Verify `config/env.ts` passes validation on build
5. Confirm treasury and Stripe keys are server-only
6. Enable Sentry DSN in staging/production
