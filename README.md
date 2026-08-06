# Nexar Network · ATLAS

**ATLAS** is the Business Operating System by NEXAR NETWORK — production fintech + crypto infrastructure on Next.js and Supabase.

> Platform constitution: [docs/ATLAS.md](docs/ATLAS.md)

## Features

- **Auth** — Email, Google, Apple; customer & merchant registration
- **Marketplace** — Product catalog, search, cart, checkout
- **Payments** — Crypto (NXR, BNB, USDT) via popup with QR; automatic fee split
- **Invoices** — PDF generation, role-scoped access (no public pages)
- **Admin** — Users, merchants, orders, fees, exchange rates, audit logs

## Stack

- Next.js 16 · React 19 · TypeScript · TailwindCSS
- Supabase (PostgreSQL, Auth, Storage, Realtime)
- BNB Smart Chain (BEP-20)
- viem for blockchain interaction

## Quick start

```bash
cp .env.example .env.local
# Fill in Supabase credentials

npm install
supabase db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Documentation

| Doc | Description |
|---|---|
| [docs/ATLAS.md](docs/ATLAS.md) | **ATLAS platform constitution** |
| [docs/architecture.md](docs/architecture.md) | System design |
| [docs/database.md](docs/database.md) | Schema & RLS |
| [docs/security.md](docs/security.md) | Security model |
| [docs/payment-flow.md](docs/payment-flow.md) | Payment sequence |
| [docs/security-checklist.md](docs/security-checklist.md) | Production checklist |
| [docs/phase-6-launch.md](docs/phase-6-launch.md) | Deployment guide |
| [docs/launch-runbook.md](docs/launch-runbook.md) | Production runbook |

## Key routes

| Route | Role |
|---|---|
| `/login` | All users |
| `/customer/browse` | Customer |
| `/merchant/products` | Merchant |
| `/admin/dashboard` | Admin |

## Admin setup

```sql
UPDATE public.profiles
SET role = 'admin', profile_completed = true
WHERE email = 'your@email.com';
```

## Health check

```
GET /api/health
```

Returns `healthy`, `degraded`, or `unhealthy` with per-service checks (Supabase, payments, monitoring).

## Cron (payment session expiry)

```
GET /api/cron/expire-sessions
Authorization: Bearer <CRON_SECRET>
```

Schedule every minute in production. See [docs/launch-runbook.md](docs/launch-runbook.md).

## Pre-launch validation

```bash
npm run prelaunch   # typecheck + lint + build
```

## License

Private — Nexar Network
