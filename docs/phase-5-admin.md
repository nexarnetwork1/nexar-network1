# Phase 5 — Admin & Platform

## Admin access

Promote a user to admin:

```sql
UPDATE public.profiles
SET role = 'admin', profile_completed = true
WHERE email = 'admin@nexarnetwork.org';
```

Sign in at `/login?redirect=/admin/dashboard`.

## Admin routes

| Route | Purpose |
|---|---|
| `/admin/dashboard` | Platform overview |
| `/admin/analytics` | Revenue, fees, settlement stats |
| `/admin/users` | User list, role management |
| `/admin/merchants` | Store approval (pending → active) |
| `/admin/orders` | All orders |
| `/admin/invoices` | All invoices |
| `/admin/payments` | Payment sessions + settlements |
| `/admin/platform-fees` | Treasury wallet, fee schedules |
| `/admin/exchange-rates` | Crypto/USD rates |
| `/admin/promotions` | Merchant fee promotions |
| `/admin/audit-logs` | Platform audit trail |
| `/admin/security` | Security configuration status |

## Key admin actions

- **Activate merchant**: Merchants → set store status to `active` (triggers 3-month promotion)
- **Configure treasury**: Platform Fees → treasury wallet address
- **Update fees**: Platform Fees → add new fee schedule entry
- **Exchange rates**: Used by payment popup for crypto amount conversion

All admin mutations use the service role via server actions with `requireRole(['admin'])`.
