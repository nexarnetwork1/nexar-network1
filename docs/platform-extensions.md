# Platform Extensions

Architecture extensions for escrow, disputes, verification, realtime, notifications, settlements, withdrawals, loyalty, coupons, multi-store, POS, multi-chain, public API, webhooks, and search.

## Migrations

| File | Purpose |
|------|---------|
| `20260727000018_platform_extensions.sql` | Core tables, enums, RLS, RPCs, realtime |
| `20260727000019_escrow_payment_integration.sql` | Escrow hold on `complete_payment()` |
| `20260727000020_realtime_search_completion.sql` | Wallet/settlement realtime + expanded global search |

## Modules

| Module | Path | Status |
|--------|------|--------|
| Escrow | `modules/escrow/` | Active |
| Disputes | `modules/disputes/` | Active |
| Verification | `modules/verification/` | Active |
| Withdrawals | `modules/withdrawals/` | Active |
| Coupons | `modules/coupons/` | Active |
| Webhooks | `modules/webhooks/` | Active |
| Settlement Reports | `modules/settlement-reports/` | Active |
| Search | `modules/search/` | Active |
| Loyalty | `modules/loyalty/` | Architecture only |
| POS | `modules/pos/` | Architecture only |
| Multi-chain | `modules/chains/` | BSC active, others prepared |
| Public API | `modules/public-api/` | Preview (`/api/v1`) |

## Escrow Flow

1. Payment completes → merchant amount held in `escrows` (status `held`)
2. Platform fee credited to treasury immediately
3. Settlement remains `pending` until escrow released
4. Admin or auto-release → `release_escrow()` → settlement worker pays merchant
5. Dispute refund → `refund_escrow()` → customer refunded, order `refunded`

## Disputes

- Customer: open dispute, messages, evidence upload
- Merchant: reply, evidence, accept refund
- Admin: review, approve/reject, release escrow
- All actions audited via `audit_logs`

## Realtime (Supabase)

Tables published: `payment_sessions`, `orders`, `invoices`, `notifications`, `escrows`, `disputes`, `wallet_transactions`, `settlements`

Hooks:
- `hooks/useRealtimeSubscription.ts`
- `hooks/useRealtimeNotifications.ts`
- `hooks/useRealtimeOrders.ts` (merchant + customer scopes)
- `hooks/useRealtimeWallet.ts`

Providers:
- `components/realtime/MerchantRealtimeProvider.tsx`
- `components/realtime/CustomerRealtimeProvider.tsx`

## Notification Center

Unified dispatcher: `modules/notifications/dispatch.ts`

Channels: in-app (active), email (active), SMS/push/Telegram (prepared via `notification_preferences`)

## Settlement Reports

Generate daily/weekly/monthly via `modules/settlement-reports/repository.ts`

Export: CSV, Excel XML, PDF text via `/api/admin/settlement-reports/[id]/[format]`

## Withdrawals

Merchants request withdrawal; blocked when escrow held. Admin approves/rejects.

## Multi-Store

`getMerchantStores()` returns all stores for an owner. `StoreSwitcher` component for merchant UI.

## Webhooks

Merchants configure endpoints per store. Deliveries queued with HMAC signatures and retries.

Cron: `GET /api/cron/webhooks` (Bearer `CRON_SECRET`)

## Search

`GET /api/search?q=…` → `global_search()` RPC (role-aware)

## System Health

Admin dashboard: `/admin/system-health` — API, DB, realtime, blockchain, treasury, jobs, queue metrics.

## Future Activation

- **Loyalty:** set `loyaltyConfig.enabled = true`
- **POS:** set `posConfig.enabled = true`, register `pos_devices`
- **Multi-chain:** activate chains in `supported_chains` table
- **Public API:** issue keys via `api_keys`, implement `/api/v1/*` routes with key middleware

## Admin Pages

- `/admin/system-health`
- `/admin/escrow`
- `/admin/disputes`
- `/admin/disputes/[id]`
- `/admin/verification`
- `/admin/withdrawals`
- `/admin/settlement-reports`
- `/admin/coupons`

## Merchant Pages

- `/merchant/stores`
- `/merchant/disputes`
- `/merchant/disputes/[id]`
- `/merchant/withdrawals`
- `/merchant/webhooks`
- `/merchant/coupons`

## Customer Pages

- `/customer/disputes`
- `/customer/disputes/[id]`
