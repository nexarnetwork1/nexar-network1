# ATLAS Core — One Platform / One Brain

**Integration spine of ATLAS by NEXAR NETWORK**

> ATLAS is no longer a collection of modules.  
> ATLAS Core connects every capability through events, one outbox, one timeline, one search index, one notification hub, and one analytics bridge.

---

## Mission

Integrate existing modules — **do not** invent new product features. Masters stay with their owners (Business, Product, Order, …).

---

## Architecture

| Layer | Location |
|-------|----------|
| Context | `atlasCore` |
| Module | `modules/atlas-core/` |
| Database | `atlas_core_*` |
| Port | `AtlasCorePort` |
| Bus | `domains/events/bus.ts` (+ outbox dual-write) |
| Permissions | `domains/permissions/matrix.ts` (unchanged SoT) |

### Ownership

Owns: Outbox · Timeline · Search documents · Analytics facts · Workflow runs · Notification dispatches  

Consumes: all domain events; never Business/Product/Order masters.

---

## Event flow

```
Emitter (Business / Catalog / Payments / …)
    → publishDomainEvent
        → Outbox dual-write (durable prep)
        → Peer module handlers (Network, Pulse, Finance, …)
        → Core wildcard (*):
            Timeline · Analytics · Search · Notification Hub · Workflow audit
```

### Flagship workflows

| Trigger | Orchestration |
|---------|----------------|
| `business.created` | Network · Pulse · Connect · AI · Marketplace · Finance · NXR · Apps · Search · Timeline |
| `product.published` | Marketplace · Pulse · Search · AI · Analytics · Timeline · Notifications |
| `order.paid` | Finance · Marketplace · CRM · Analytics · NXR · Pulse · Connect · Mobile · Timeline · Notifications |
| `network.post_created` | Pulse · Search · Analytics · AI · Timeline |
| `business.verification_approved` | Network · NXR · Apps · Timeline · Notifications · Search |
| `nxr.subscription_paid` | Finance · Apps · Timeline · Analytics · Notifications |

Commerce emit bridges: `lib/payments/finalize-crypto-payment.ts` → `payment.confirmed` + `order.paid`; `modules/catalog/actions.ts` → `product.published` when active.

---

## Notification hub

Central fan-out via `dispatchNotificationHub` → `modules/notifications` (in-app/email) + Mobile push. SMS/Webhook channels reserved.

---

## Search & analytics

- Search: `atlas_core_search_documents` (+ legacy `global_search` RPC)
- Analytics: `atlas_core_analytics_facts` from every domain event

---

## Outbox

`atlas_core_outbox` dual-write on every publish. Status pipeline ready for async workers (pending → published). In-process handlers remain primary until Phase 14 queue.

---

## Port (`AtlasCorePort`)

`handleEvent` · `search` · `notify` · `indexDocument`

`createNotificationsPortAdapter()` implements `NotificationsPort`.

- Docs: `docs/ATLAS-CORE.md` · full report: `docs/ATLAS-CORE-INTEGRATION-REPORT.md`
