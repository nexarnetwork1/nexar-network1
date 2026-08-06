# Module Documentation

Domain modules live in `modules/`. Each module is a capability inside **ATLAS** — see [ATLAS.md](./ATLAS.md).

## ATLAS mapping

| ATLAS module | Code path | Bounded context |
|--------------|-----------|-----------------|
| Business | `modules/business-hub/` | `businessHub` |
| Network | `modules/atlas-network/` | `atlasNetwork` |
| Pulse | `modules/atlas-pulse/` | `atlasPulse` |
| Connect | `modules/atlas-connect/` | `atlasConnect` |
| Marketplace | `modules/atlas-marketplace/` (+ `modules/marketplace/`) | `marketplace` |
| AI | `modules/atlas-ai/` | `atlasAi` |
| Apps | `modules/atlas-apps/` | `atlasApps` |
| Finance | `modules/atlas-finance/` (+ `payments`/`invoices`/`wallet` rails) | `atlasFinance` |
| Mobile | `modules/atlas-mobile/` | `atlasMobile` |
| NXR | `modules/atlas-nxr/` (+ `lib/web3` adapters later) | `nxrToken` |
| Core | `modules/atlas-core/` | `atlasCore` |
| NEXAR HQ | `modules/atlas-hq/` (+ legacy `app/admin`, `lib/admin`) | `atlasHq` |
| Wallet | `modules/wallet/` | `wallet` |
| Finance | `modules/payments/`, `invoices/`, `settlement/` | `payments` |

Root navigation scaffold: `config/atlas-nav.ts`.

## Module Structure

```
modules/<name>/
├── index.ts          # Public exports
├── types.ts          # Module-specific types (optional)
├── validators.ts     # Zod input schemas
├── repository.ts     # Database access (Supabase queries)
├── actions.ts        # Server actions (thin — call repository/service)
└── service.ts        # Business logic (optional, added per module)
```

## Module Dependency Order

Lower layers never import from higher layers.

```
auth
 └── users
      └── stores
           └── catalog
                └── cart
                     └── orders
                          └── invoices
                               └── payments
                                    └── settlement
                                         └── audit

platform ──┐
promotions ─┤
            └── settlement
```

## Module Reference

| Module | Responsibility | Key Tables |
|---|---|---|
| `business-hub` | ATLAS Business — company aggregate, membership, store linkage | `businesses`, `business_memberships` |
| `auth` | Login, register, OAuth, profile completion | `profiles` |
| `users` | User profile CRUD | `profiles` |
| `stores` | Merchant store management | `stores` |
| `catalog` | Product CRUD and browsing | `products` |
| `cart` | Shopping cart operations | `carts`, `cart_items` |
| `orders` | Order creation and status | `orders`, `order_items` |
| `invoices` | Invoice generation and PDF | `invoices` |
| `payments` | Payment sessions (crypto + card) | `payment_sessions` |
| `settlement` | On-chain verification and fee split | `settlements`, `transfers` |
| `wallet` | Customer wallet operations | — |
| `promotions` | Merchant discount campaigns | `promotions` |
| `platform` | Admin settings and fees | `platform_settings` |
| `audit` | Audit log writes and queries | `audit_logs` |
| `analytics` | Platform metrics aggregation | — |
| `notifications` | Notification dispatch | — |

## Usage Pattern

### From Server Actions (preferred)

```ts
import { orders } from "@/modules";

// In a server action or route handler
const result = await orders.actions.createOrder(cartId);
```

### From Services (scaffold — implement per phase)

```ts
import { OrderService } from "@/services";

const service = new OrderService();
// Workflows added in Phase 3+
```

### From Features (UI layer)

```tsx
import { useZodForm } from "@/hooks/useZodForm";
import { loginSchema } from "@/schemas";
import { auth } from "@/modules";
```

## Rules

1. **No business logic in UI** — pages and components call actions or services
2. **No duplicated queries** — all database access goes through repositories
3. **Validators at the boundary** — every action validates input with Zod
4. **Audit critical operations** — use `auditLogger` for state changes
5. **RLS is the last line of defense** — repositories assume RLS is active

## Adding a New Module

1. Create `modules/<name>/` with index, validators, repository
2. Add migration in `supabase/migrations/`
3. Export from `modules/index.ts`
4. Create matching feature in `features/<name>/` with `hooks/` and `components/` subfolders
5. Add service class in `services/<name>.service.ts` when workflows grow complex
