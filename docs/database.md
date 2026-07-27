# Nexar Network — Database Plan

PostgreSQL on Supabase with RLS on every public table.

## Schemas

| Schema | Purpose |
|---|---|
| `public` | Application tables (RLS enabled) |
| `private` | Security definer functions, internal helpers (not exposed via Data API) |

## Core Tables

### Identity & Access

- **profiles** — extends `auth.users`; role, wallet, profile completion flag
- **stores** — merchant stores; mode (`marketplace` | `payments_only`), payout wallet

### Commerce

- **products** — store catalog
- **carts** / **cart_items** — customer cart sessions
- **orders** / **order_items** — order lifecycle with fee breakdown
- **invoices** — linked 1:1 to orders; no public access

### Payments

- **payment_sessions** — popup entity; QR, deposit address, 5-minute expiry
- **payment_attempts** — detected transactions or card attempts
- **settlements** — fee calculation and payout orchestration
- **settlement_transfers** — treasury fee + merchant payout records

### Platform

- **platform_settings** — treasury wallet, token addresses, support email (singleton)
- **fee_schedules** — NXR 3.5%, other crypto 5%, card provider rate
- **merchant_promotions** — new merchant 50% fee discount for 3 months
- **exchange_rates** — cached FX/crypto rates

### Audit

- **audit_logs** — append-only; actor, action, entity, metadata

## Atomic Functions (private schema)

| Function | Purpose |
|---|---|
| `create_checkout(...)` | order + invoice + payment_session in one transaction |
| `calculate_platform_fee(...)` | fee schedule + active promotion |
| `mark_payment_paid(...)` | update session, invoice, order; create settlement |
| `complete_settlement(...)` | finalize transfers; update revenue counters |
| `expire_stale_payment_sessions()` | cron: expire sessions past 5 minutes |
| `write_audit_log(...)` | append audit entry |

## RLS Summary

| Table | customer | merchant | admin |
|---|---|---|---|
| profiles | own R/W | own R/W | all R/W |
| stores | active R | own R/W | all R/W |
| products | active R | own store R/W | all R/W |
| orders | own R | store R | all R/W |
| invoices | own R | store R | all R/W |
| payment_sessions | own R | store R | all R/W |
| platform_settings | deny | deny | R |
| audit_logs | deny | store-related R | all R |
| settlements | deny | store R | all R/W |

Authorization role is read from `profiles.role`, not `user_metadata`.

## Migrations

All schema changes live in `supabase/migrations/`. Apply with Supabase CLI:

```bash
supabase db push
supabase migration list
```
