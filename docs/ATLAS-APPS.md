# ATLAS Apps — Business Applications Platform

**Expandable Business Operating System layer by NEXAR NETWORK**

> ATLAS is **not** a fixed ERP. Businesses install only the applications they need.  
> Every application becomes part of ATLAS through scoped permissions and plugin contracts.

---

## Mission

Think Apple App Store / Shopify Apps / Salesforce AppExchange — built for Business.

---

## Architecture

| Layer | Location |
|-------|----------|
| Bounded context | `atlasApps` |
| Pillar module | `modules/atlas-apps/` |
| Database | `atlas_apps_*` |
| Port | `AtlasAppsPort` |
| Plugin contracts | `modules/atlas-apps/plugins.ts` |

### Naming

Jobs context owns aggregate `Application` (job applications). Apps uses **`App*`** prefixes (`AppApplication`, `AppInstall`, …).

### Ownership (charter)

| Aggregate | Owner |
|-----------|--------|
| Business, Product, Order, Employee, Wallet | respective masters (`businessHub`, `orders`, …) |
| Catalog apps, installs, versions, developers, reviews, licenses, webhooks, settings | `atlasApps` |

Apps **request** permission scopes — they never own master data.

---

## Root Entities

| Entity | Table |
|--------|-------|
| AppDeveloper | `atlas_apps_developers` |
| AppCategory | `atlas_apps_categories` |
| AppApplication | `atlas_apps_applications` |
| AppVersion / AppUpdate | `atlas_apps_versions`, `atlas_apps_updates` |
| AppPermission | `atlas_apps_permission_defs`, `atlas_apps_install_permissions` |
| AppLicense | `atlas_apps_licenses` |
| AppInstall (BusinessApplication) | `atlas_apps_installs` |
| AppSettings | `atlas_apps_settings` |
| AppSubscription | `atlas_apps_subscriptions` |
| AppReview / AppRating | `atlas_apps_reviews` (+ aggregates on application) |
| AppWebhook | `atlas_apps_webhooks` |
| AppApiKey | `atlas_apps_api_keys` |
| AppAuditLog | `atlas_apps_audit_logs` |
| AppEarnings | `atlas_apps_earnings` |

### Application types (categories)

CRM · HR · Finance · Accounting · Inventory · POS · Restaurant · Clinic · Hospital · Hotel · Manufacturing · Booking · Education · Construction · Real Estate · Shipping · Logistics · Marketing · Support · Analytics · AI · Developer Tools

---

## Installation lifecycle

`install` → `enable` / `disable` → `upgrade` / `rollback` → `uninstall`

All installs are **business-scoped**. Empty install set is valid (Businesses are not forced into an ERP suite).

---

## Permission scopes

Apps declare scopes: `business`, `products`, `orders`, `crm`, `finance`, `employees`, `wallet`, `documents`, `ai`, `marketplace`, `connect`, `pulse`, `network`, `analytics`, `settings`.

Platform RBAC: `apps:*` in `domains/permissions/matrix.ts`.

---

## Domain Events

| Event | When |
|-------|------|
| `apps.application_installed` | Install / reinstall |
| `apps.application_updated` | Upgrade or rollback |
| `apps.application_removed` | Uninstall |
| `apps.application_enabled` | Enable |
| `apps.application_disabled` | Disable |

Inbound signals (recommend only, no forced install): `business.created`, `product.published`, `order.paid`.

---

## Plugin & developer contracts

- **Manifest** — `AppPluginManifest` (`pluginApi`, permissions, webhooks, settings schema)
- **Lifecycle hooks** — `onInstall` / `onEnable` / `onDisable` / `onUpgrade` / `onRollback` / `onUninstall` (stub runner today)
- **Sandbox** — `AppSandboxPolicy` (egress, storage, CPU, permission isolation)
- **Publishing** — draft → submitted → in_review → approved → published
- **API keys** — hashed secrets; prefix returned; full secret once

---

## Monetization (schema-ready)

Free · one-time · subscription · freemium · enterprise  
Revenue share & developer earnings tables present; billing adapters later.

---

## Port surface (`AtlasAppsPort`)

`discover` · `getBySlug` · `listInstalled` · `install` · `enable` · `disable` · `uninstall` · `recommend`

REST / GraphQL / SDK / CLI adapters consume this port — not module internals.

---

## Security

- Permission isolation per install
- Sandbox policy contract
- Review / verification flags on applications
- Audit logs for install lifecycle
- Soft-delete on catalog apps

---

## Related

| Document | Purpose |
|----------|---------|
| [ATLAS.md](./ATLAS.md) | Platform constitution |
| [ATLAS-MARKETPLACE.md](./ATLAS-MARKETPLACE.md) | Sales channel (not App Store) |
| [ATLAS-AI.md](./ATLAS-AI.md) | Intelligence that recommends apps |
| Migration | `supabase/migrations/20260804200000_atlas_apps_foundation.sql` |
