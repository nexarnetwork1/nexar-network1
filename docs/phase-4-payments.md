# Phase 4 — Payments Core

## Setup

```bash
supabase db push
```

Required env vars:
- `PAYMENT_MASTER_SEED` — server-only seed for per-session deposit addresses
- `SUPABASE_SERVICE_ROLE_KEY` — settlement and payment completion
- `TREASURY_WALLET_ADDRESS` or configure via `platform_settings`
- `BSC_RPC_URL`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — card payments
- `RESEND_API_KEY`, `EMAIL_FROM` — payment and invoice emails

## Payment Flow

1. Customer clicks **Pay now** on order/invoice
2. Selects method based on store settings:
   - **Crypto:** NXR, BNB, USDT
   - **Card:** Stripe PaymentIntent via Elements modal
3. **Payment popup** opens (no separate page):
   - Invoice number, amount, wallet/QR (crypto) or card form
   - 5-minute countdown (crypto sessions)
   - Status: waiting → confirmed → completed | expired | cancelled
4. **Crypto:** customer sends to unique deposit address; cron verifies on-chain
5. **Card:** Stripe webhook `payment_intent.succeeded` completes payment
6. Settlement splits:
   - Platform fee → treasury wallet
   - Net amount → merchant wallet

## Fee Rates

| Method | Base rate |
|---|---|
| NXR | 3.5% |
| BNB / USDT | 5.0% |
| Card (Stripe) | 5.0% |
| New merchants | 50% discount for 3 months |

## API

| Route | Purpose |
|---|---|
| `POST /api/webhooks/stripe` | Stripe signature verify → `complete_payment` |
| `GET /api/cron/verify-payments` | Background crypto verification |
| `GET /api/cron/retry-settlements` | Retry failed merchant settlements |

## Realtime

Payment popup subscribes to `payment_sessions` updates via Supabase Realtime.

## Cron

- `expire_stale_payment_sessions()` — every minute
- `/api/cron/verify-payments` — poll pending crypto sessions
- `/api/cron/retry-settlements` — retry failed settlements

## Customer cancellation

Customers can cancel `pending_payment` orders via `cancel_pending_order` RPC (migration `20260727000011`).
