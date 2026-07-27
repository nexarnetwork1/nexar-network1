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

## Payment Flow

1. Customer clicks **Pay now** on order/invoice
2. Selects crypto method (NXR, BNB, USDT)
3. **Payment popup** opens (no separate page):
   - Invoice number, amount, wallet, QR code
   - 5-minute countdown
   - Status: waiting → paid | expired
4. Customer sends crypto to unique deposit address
5. System verifies on-chain, completes payment, splits settlement:
   - Platform fee → treasury wallet
   - Net amount → merchant wallet

## Fee Rates

| Method | Base rate |
|---|---|
| NXR | 3.5% |
| BNB / USDT | 5.0% |
| New merchants | 50% discount for 3 months |

## API

| Route | Purpose |
|---|---|
| `POST /api/webhooks/stripe` | Card payments (stub) |

## Realtime

Payment popup subscribes to `payment_sessions` updates via Supabase Realtime.

## Cron

Schedule `expire_stale_payment_sessions()` every minute via Supabase cron or Edge Function.
