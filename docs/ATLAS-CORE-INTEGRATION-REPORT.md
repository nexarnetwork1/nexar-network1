# ATLAS Core Integration Report — Phase 11

**ATLAS by NEXAR NETWORK — One Platform / One Brain**  
**Status:** Foundation complete · Integration spine live · UI deferred

---

## 1. Integration Report (executive)

ATLAS is no longer a loose set of modules. **ATLAS Core** (`atlasCore` / `modules/atlas-core`) is the integration spine: every `publishDomainEvent` dual-writes to the durable outbox, peers still own their handlers, and Core’s wildcard subscriber appends timeline, analytics facts, search documents, notification hub fan-out, and workflow audit rows.

No new product features were built. Existing masters (Business, Product, Order, Wallet, Invoice) remain with their owners. Commerce emit bridges now fire `product.published`, `order.paid`, and `payment.confirmed` so peer handlers and Core actually run on real paths.

---

## 2. Architecture Report

```
┌─────────────────────────────────────────────────────────────┐
│                     ATLAS Application Shell                   │
│              config/atlas-* · domains/atlas.ts                │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                    ATLAS CORE (atlasCore)                     │
│  Outbox · Timeline · Search · Analytics · Notify · Workflows │
│              AtlasCorePort · NotificationsPort adapter       │
└───────────┬─────────────────────────────┬───────────────────┘
            │ domain events (bus)         │ contracts/ports
┌───────────▼──────────┐    ┌─────────────▼────────────────────┐
│ Business Hub         │    │ Marketplace · Network · Pulse    │
│ Catalog · Orders     │    │ Connect · AI · Apps · Finance    │
│ Payments · Wallet    │    │ Mobile · NXR · CRM · Analytics   │
└──────────────────────┘    └──────────────────────────────────┘
```

| Concern | Owner | Notes |
|---------|-------|-------|
| Business / Product master | `businessHub` | Never stolen by Core or Marketplace |
| Order / Invoice / Payment | `orders` / payments / invoices | Core consumes events only |
| Fiat Wallet | `wallet` | NXR does not duplicate |
| Outbox / Timeline / Search docs / Analytics facts | `atlasCore` | New `atlas_core_*` tables |
| RBAC | `domains/permissions/matrix.ts` | Added `core:*` permissions |
| Event catalog | `domains/events/catalog.ts` | Shared vocabulary |

**Registration order** (`instrumentation.ts`): Core first (outbox writer), then Network → Pulse → Connect → AI → Marketplace → Apps → Finance → Mobile → NXR.

---

## 3. Event Flow

```
Action (Server Action / payment finalize / Business Hub service)
  → publishDomainEvent(event)
       1. Outbox writer → atlas_core_outbox (pending → published)
       2. Named peer handlers (marketplace listing, finance journal, …)
       3. Core wildcard (*):
            Timeline (business · company · customer · user · platform)
            Analytics fact
            Search upsert (mapped events)
            Notification hub (in_app · email · push; sms/webhook reserved)
            Workflow run audit (flagship triggers)
```

### Flagship workflows

| Trigger | Downstream (owned by peers; audited by Core) |
|---------|-----------------------------------------------|
| `business.created` | Network · Pulse · Connect · AI · Marketplace · Finance · NXR · Apps · Search · Timeline |
| `product.published` | Marketplace · Pulse · Search · AI · Analytics · Timeline · Notifications |
| `order.paid` | Finance · Marketplace · CRM · Analytics · NXR · Pulse · Connect · Mobile · Timeline · Notifications |
| `network.post_created` | Pulse · Search · Analytics · AI · Timeline |
| `business.verification_approved` | Network · NXR · Apps · Timeline · Notifications · Search |
| `nxr.subscription_paid` | Finance · Apps · Timeline · Analytics · Notifications |

### Emit bridges (critical path)

| Source | Events |
|--------|--------|
| `modules/business-hub/service.ts` | `business.created`, verification events |
| `modules/catalog/actions.ts` | `product.published` (create / update / toggle active) |
| `lib/payments/finalize-crypto-payment.ts` | `payment.confirmed`, `order.paid` (resolves `business_id` via store) |
| Network / Pulse / Connect / AI / Apps / Finance / Mobile / NXR services | Module-owned emits |

---

## 4. Connected Modules

| Module | Context | Connected via |
|--------|---------|---------------|
| Business | `businessHub` | Emits + consumes Core timeline/search |
| Marketplace | `atlasMarketplace` | `product.published` / `order.paid` handlers |
| Network | `atlasNetwork` | `business.created` / verification |
| Pulse | `atlasPulse` | Feed ingest on commerce + posts |
| Connect | `atlasConnect` | Sale / workspace notifications |
| AI | `atlasAi` | Provision + product insight handlers |
| Apps | `atlasApps` | Recommend / unlock hints |
| Finance | `atlasFinance` | Journal on payment events |
| Mobile | `atlasMobile` | Push via notification hub |
| NXR | `nxrToken` | Rewards / subscription |
| CRM / Analytics / Wallet / Notifications | existing | Consumed through events / hub / facts |
| **Core** | `atlasCore` | Spine for all of the above |

---

## 5. Remaining Weak Links

1. **Durable outbox processor** — dual-write exists; async worker / dead-letter / at-least-once replay is Phase 15.
2. **CRM / Inventory / Invoice auto-create** — workflow steps declared; some peers still stub or partial on `order.paid`.
3. **AI description / summary generation** — handlers record intent; LLM side-effects not fully wired on every publish.
4. **Legacy payment paths** — non-crypto / non-finalize flows may not emit `order.paid` yet.
5. **Search** — Core index + legacy `global_search` RPC coexist; unify query path in shell UI.
6. **SMS / Webhook notification channels** — reserved in hub; not delivery-backed.
7. **Company vs business timeline** — both scopes written when `businessId` present; product may later collapse naming.
8. **In-process bus only** — multi-instance / multi-region requires queue before scale.

---

## 6. Recommended Improvements

1. Ship outbox worker with idempotent consumer keys and DLQ.
2. Audit all order settlement paths; emit `order.paid` / `payment.confirmed` from one finalize helper.
3. Resolve `store_id → business_id` in a shared OrdersPort helper (avoid ad-hoc casts).
4. Collapse dual search (Core documents vs discovery RPC) behind `AtlasCorePort.search`.
5. Add integration tests with a fake outbox + in-memory bus covering product → marketplace → timeline.
6. Surface Core timeline / unified search in ATLAS shell (Phase 12+), still via ports.
7. Wire AI agent jobs for `product.published` / `network.post_created` through `AtlasAiPort`.

---

## 7. Technical Debt

| Item | Severity | Notes |
|------|----------|-------|
| Workflow “completed” without waiting on peers | Medium | Audit is optimistic; peers may fail independently |
| Silent `catch` on hub / Core wildcard | Medium | Prefer structured logging / Sentry breadcrumbs |
| `handleCoreDomainEvent` vs bus split | Low | Port path includes outbox; bus uses writer + wildcard — avoid calling both |
| Order type lacks typed `store.business_id` | Low | Select updated; types may lag |
| Prefixed Core* aggregates vs legacy OutboxMessage alias | Low | Ownership maps both to `atlasCore` |
| Duplicate marketplace revalidatePath | Cosmetic | Harmless |

---

## 8. Performance Notes

- Wildcard handler runs on **every** domain event — keep work O(1) inserts; avoid heavy joins in Core.
- Timeline may write 2–4 rows per event (scopes) — acceptable at foundation; consider batch insert later.
- Search upserts are event-driven — prefer async when volume spikes.
- Outbox dual-write adds one insert per publish — required for durability; batch flush in worker phase.
- Notification hub dynamic-imports notifications + mobile — cold path cost amortized by peer handlers already loading.

---

## 9. Readiness Score

| Dimension | Score | Comment |
|-----------|-------|---------|
| Event catalog & bus | **9/10** | Catalog rich; outbox dual-write live |
| Ownership / SoT | **9/10** | Masters preserved; Core owns integration data only |
| Cross-module workflows | **7.5/10** | Plans + peer handlers; some side-effects stubby |
| Notification hub | **7/10** | in_app / email / push; sms/webhook ready |
| Timeline | **8/10** | Multi-scope; UI not built |
| Unified search | **7/10** | Index table + port; dual query paths remain |
| Analytics bridge | **7.5/10** | Facts from all events; dashboards later |
| Permissions | **8.5/10** | Matrix SoT + `core:*` |
| Emit coverage (commerce) | **8/10** | Product + crypto finalize; other pay paths TBD |
| Tests | **8/10** | Unit + integration foundation green |
| Production durability | **5.5/10** | Needs outbox worker |
| **Overall OS readiness** | **7.8 / 10** | Cohesive ecosystem foundation; shell + workers next |

---

## 10. Deliverables checklist

- [x] `modules/atlas-core/` (types, workflows, hub, search, repo, service, events, port)
- [x] Migration `20260804280000_atlas_core_integration.sql`
- [x] Domain map / ownership / ports / instrumentation / nav
- [x] Commerce emit bridges (catalog + payment finalize)
- [x] Permission matrix `core:*`
- [x] Docs: `docs/ATLAS-CORE.md`, roadmap Phase 11 in `docs/ATLAS.md`
- [x] Tests: `tests/unit|integration/atlas-core/foundation.test.ts`
- [x] This Integration Report

---

**Verdict:** ATLAS Core Integration (Phase 11) establishes the Operating System spine. Modules communicate through events and contracts; Core is the brain for timeline, search, notifications, analytics, and workflow audit. Next: shell navigation (Phase 12), then durable outbox workers (Phase 15).
