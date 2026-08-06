# Nexar Network — Architecture

**Platform:** [ATLAS](./ATLAS.md) — Business Operating System by NEXAR NETWORK

Production fintech + crypto payment ecosystem on Next.js App Router and Supabase.

## ATLAS Platform Layer

ATLAS is the application shell. Bounded contexts (`domains/map.ts`) are capabilities inside ATLAS:

- **Business** (internal: `businessHub`) — company aggregate, stores, product master
- **Marketplace** (`marketplace`) — sales channel; listings reference Business Product masters
- **Network** (`atlasNetwork`) — business social graph
- **Pulse** (`atlasPulse`) — business intelligence feed
- **Connect** (`atlasConnect`) — collaboration platform (not chat); messages become business actions
- **AI** (`atlasAi`) — business intelligence engine (not a chatbot); agents, workflows, knowledge
- **Apps** (`atlasApps`) — business applications platform; installable CRM/HR/Finance/… plugins
- **Finance** (`atlasFinance`) — financial OS; GL/tax/budgets over Invoice/Payment/Wallet masters
- **Mobile** (`atlasMobile`) — complete mobile platform; offline sync, push, devices (not a companion app)
- **NXR** (`nxrToken`) — digital economy utility token; blockchain-optional
- **Core** (`atlasCore`) — integration spine: outbox, timeline, search, notification hub, analytics bridge
- **NEXAR HQ** (`atlasHq`) — sole internal administration (Platform Owner, Website CMS, Team); legacy Admin evolved here
- **Wallet, Analytics, …** — satellite modules

See [ATLAS Constitution](./ATLAS.md). HQ: [ATLAS-HQ.md](./ATLAS-HQ.md). Core: [ATLAS-CORE.md](./ATLAS-CORE.md). NXR: [ATLAS-NXR.md](./ATLAS-NXR.md). Mobile: [ATLAS-MOBILE.md](./ATLAS-MOBILE.md). Finance: [ATLAS-FINANCE.md](./ATLAS-FINANCE.md). Apps: [ATLAS-APPS.md](./ATLAS-APPS.md). Marketplace: [ATLAS-MARKETPLACE.md](./ATLAS-MARKETPLACE.md). AI: [ATLAS-AI.md](./ATLAS-AI.md). Connect: [ATLAS-CONNECT.md](./ATLAS-CONNECT.md).

## Principles

- Every entity is linked: order → invoice → payment session → settlement → audit
- No mock data, no temporary solutions, no duplicated business logic
- Platform fees never remain in merchant wallets
- Secrets and treasury configuration are server-only and never hardcoded

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, TailwindCSS, Shadcn UI |
| Backend | Supabase + Next.js Route Handlers / Server Actions |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (Email, Google, Apple) |
| Blockchain | BNB Smart Chain (BEP-20), NXR token |
| Cards | Stripe Connect |
| Realtime | Supabase Realtime (payment popup status) |

See also: [Smart Contract Integration Guide](./smart-contract-integration.md), [Payment Flow](./payment-flow.md).

## Pattern: Modular Monolith

Domain logic lives in `modules/`. Each module owns types, validators, repository, service, and server actions. UI in `app/` and `components/` stays thin.

## Route Groups

| Group | Purpose |
|---|---|
| `(marketing)` | Public landing, news, market info |
| `(auth)` | Login, register, OAuth, profile completion |
| `(customer)` | Browse, cart, checkout, orders, invoices, wallet |
| `(merchant)` | Dashboard, products, orders, store, revenue |
| `(admin)` | Platform administration |

## Payment Model

Crypto payments land on platform-controlled deposit addresses. A settlement worker verifies on-chain, splits fee to treasury and net to merchant, then updates all linked records in a single database transaction.

Card payments use Stripe Connect application fees so platform revenue never passes through the merchant balance.

## Module Dependency Order

```
auth → users → stores → catalog → cart → orders → invoices → payments → settlement → audit
platform → promotions → settlement
```

Lower layers never import from higher layers.

## Foundation Layer

Cross-cutting infrastructure (config, errors, logging, security, providers, store) is documented in:

- [ATLAS](./ATLAS.md) — platform constitution, module tree, ownership
- [Foundation](./foundation.md) — folder structure, state management, forms, security
- [Modules](./modules.md) — domain module reference
- [Configuration](./configuration.md) — env vars and config modules
- [Execution Order](./execution-order.md) — phased implementation plan

## Open Decisions (defaults in use)

1. Next.js 16 (current repo version)
2. Crypto settlement: HD wallet + settlement worker (Phase 4)
3. Card provider: Stripe Connect
4. Marketing site preserved; portals added alongside
5. Wallet address entered at registration; signature verification optional later
6. BTC/ETH deferred; launch with BNB, NXR, USDT on BSC
