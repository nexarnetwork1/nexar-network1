# ATLAS Mobile — Mobile Business Platform

**Complete mobile experience of ATLAS by NEXAR NETWORK**

> ATLAS Mobile is **not** a companion app.  
> Same business. Same data. Same permissions. Same AI. Anywhere — offline-first and cloud-synced.

---

## Mission

iOS · Android · Tablet · Foldables · Desktop companion · Wearables (future)

Every ATLAS capability (Business, Marketplace, Network, Pulse, Connect, Wallet, AI, Finance, CRM) is available on mobile through this platform layer.

---

## Architecture

| Layer | Location |
|-------|----------|
| Bounded context | `atlasMobile` |
| Module | `modules/atlas-mobile/` |
| Database | `atlas_mobile_*` |
| Port | `AtlasMobilePort` |
| Offline engine | `offline.ts` (pure) |
| Sync engine | `sync.ts` (pure) |
| Push contracts | `push.ts` (pure) |
| Deep links | `deep-links.ts` |
| Camera / OCR | `camera.ts` (stub) |

### Ownership

| Owns | Consumes |
|------|----------|
| Devices, sessions, push, offline queue, sync cursors, deep links, camera jobs, location pings, widgets, entitlements, analytics | User, Business, Product, Order, Invoice, Wallet, Connect, Pulse… |

Never duplicates Business/Product/Order masters.

---

## Offline strategy

1. Client enqueues mutations (`client_mutation_id` idempotent)
2. Sync batch prioritized: create → update/upsert → delete
3. Conflict strategies: `server_wins` · `client_wins` · `last_write_wins` · `manual_merge`
4. Offline-capable scopes: orders, inventory, CRM, business, connect, settings
5. Offline Pro entitlement expands pull scopes (wallet, finance, …)

---

## Push

Categories: business alerts, marketplace orders, messages, mentions, payments, invoices, AI insights, approvals, meetings, jobs, announcements.

Fan-out from domain events via `MOBILE_EVENT_HANDLERS`.

---

## Events

| Event | When |
|-------|------|
| `mobile.device_registered` | Device registered |
| `mobile.device_revoked` | Remote logout / revoke |
| `mobile.push_queued` | Push queued |
| `mobile.push_delivered` | Provider ack (later) |
| `mobile.offline_mutation_queued` | Offline mutation stored |
| `mobile.sync_completed` | Sync batch finished |
| `mobile.sync_conflict` | Manual merge needed |
| `mobile.session_started` | Reserved |
| `mobile.remote_command_issued` | Reserved |

---

## Port (`AtlasMobilePort`)

`registerDevice` · `queuePush` · `enqueueOfflineMutation` · `processOfflineSync` · `pullSync` · `remoteLogout` · `parseDeepLink`

REST / GraphQL / Realtime / Universal Links adapters consume this port.

---

## Security

Face ID / Touch ID / PIN flags on device · MFA session flag · Trusted devices · Remote logout · Device revoke · Permission isolation via `mobile:*`

---

## Related

| Document | Purpose |
|----------|---------|
| [ATLAS.md](./ATLAS.md) | Platform constitution |
| Migration | `supabase/migrations/20260804240000_atlas_mobile_foundation.sql` |
