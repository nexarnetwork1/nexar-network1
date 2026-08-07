# Sprint 2.8 — Unified ATLAS Ecosystem

**Objective:** Connect existing ATLAS modules into one seamless application without duplicating architecture, APIs, or business logic.

**Status:** Complete — `npm run typecheck` passes.

---

## Summary

Sprint 2.8 extended and wired the existing ATLAS social shell, network layer, marketplace cross-links, Connect search, and notification metadata into a unified navigation and deep-linking experience. No parallel implementations were introduced.

---

## Files Modified

### Configuration
| File | Change |
|------|--------|
| `config/atlas-app-nav.ts` | **New** — single source for `/atlas/*` sidebar, mobile, app bar, ecosystem links, dashboard redirects |
| `modules/atlas-network/validators.ts` | Added `messages` to `searchNetworkSchema.type` |

### Libraries
| File | Change |
|------|--------|
| `lib/atlas/activity-presenter.ts` | **New** — activity labels + href resolution for posts, jobs, events, products, stores, profiles |
| `lib/atlas/notification-links.ts` | **New** — `resolveAtlasNotificationHref()` for jobs, events, posts, profiles, companies, marketplace, orders, invoices, wallet, messages |

### Repository & Actions
| File | Change |
|------|--------|
| `modules/atlas-network/repository.ts` | Added `getActivitiesForBusiness`, `getRecentNetworkActivities`, `getNetworkProfilesByIds`, `getCompanyProfileSlugsByBusinessIds` |
| `modules/atlas-network/actions.ts` | Extended `searchNetworkAction` with Connect message search; added `fetchCompanyActivityAction`, `fetchGlobalActivityAction`; enriched `fetchProfileActivityAction` with presented activities |

### Navigation
| File | Change |
|------|--------|
| `components/atlas/app/AtlasLeftSidebar.tsx` | Consumes `ATLAS_APP_NAV_ITEMS` + `ATLAS_APP_BUSINESS_ITEMS` |
| `components/atlas/app/AtlasMobileNav.tsx` | Primary bottom nav + **More** sheet (`AtlasMobileMoreSheet`) |
| `components/atlas/app/AtlasAppBar.tsx` | Consumes `ATLAS_APP_BAR_ITEMS` from shared config |
| `components/atlas/app/AtlasMobileMoreSheet.tsx` | **New** — mobile overflow for Marketplace, Jobs, Events, Search, Profile, Business |
| `components/atlas/app/atlas-app-nav-icons.tsx` | **New** — shared Lucide icon map |
| `components/atlas/marketplace/AtlasCommerceNav.tsx` | Added Jobs + Events cross-links |

### Activity & Profiles
| File | Change |
|------|--------|
| `components/atlas/activity/ActivityItem.tsx` | **New** — unified activity row with deep links |
| `components/atlas/ui/EmptyTab.tsx` | **New** — shared empty tab panel |
| `components/atlas/app/profile/ProfileView.tsx` | Activity tab uses `ActivityItem` + shared `EmptyTab` |
| `components/atlas/app/company/CompanyProfileView.tsx` | Added **Activity** tab; shared `EmptyTab` |
| `app/atlas/network/page.tsx` | Network Activity section reads `atlas_network_activities` via `fetchGlobalActivityAction` |

### Search, Messages, Notifications
| File | Change |
|------|--------|
| `components/atlas/app/network/NetworkSearchPage.tsx` | Messages tab; Connect workspace search for authenticated users |
| `components/atlas/app/MessagingInterface.tsx` | Ecosystem quick links; message search routes to `/atlas/search?type=messages` |
| `app/atlas/notifications/page.tsx` | All sections link via `resolveAtlasNotificationHref` |

### Dashboard Bridges
| File | Change |
|------|--------|
| `app/dashboard/network/page.tsx` | Redirect → `/atlas/network` |
| `app/dashboard/pulse/page.tsx` | Redirect → `/atlas` |
| `app/dashboard/connect/page.tsx` | Redirect → `/atlas/messages` |

---

## Components Reused

- `EmptyState` pattern via new atlas-styled `EmptyTab`
- `JobCard`, `EventCard`, `MarketplaceListingCard`, `FeedPostCard` (unchanged)
- `NetworkSearchBar`, `AtlasGuestGate`, `NexarCommerceAuthProvider`
- `PremiumSection`, `PremiumStats` on network landing
- `AiAssistMenu` on search (unchanged)

---

## Repositories Reused

| Repository | Usage |
|------------|--------|
| `modules/atlas-network/repository.ts` | Profiles, posts, jobs, events, activities |
| `modules/atlas-marketplace/repository.ts` | Product/store search (via existing `searchNetworkAction`) |
| `modules/atlas-connect/repository.ts` | `searchConnectWorkspace` for message search |
| `modules/business-hub/repository.ts` | `getBusinessesForUser` for workspace-scoped message search |
| `modules/notifications/repository.ts` | `getUserNotifications` (unchanged) |

---

## Navigation Improvements

1. **Single config** — `config/atlas-app-nav.ts` drives sidebar, app bar, mobile primary, and mobile overflow.
2. **Mobile parity** — Jobs, Events, Marketplace, Search, Profile, Business Dashboard accessible via **More** sheet.
3. **Dashboard bridges** — `/dashboard/network`, `/dashboard/pulse`, `/dashboard/connect` redirect to live ATLAS routes.
4. **Commerce cross-links** — `AtlasCommerceNav` links Feed, Marketplace, Jobs, Events, Shop, Search, Company profile.
5. **Messaging ecosystem strip** — quick navigation to Feed, Network, Marketplace, Jobs, Events, Search from Messages.

---

## Integration Improvements

### Global Search
- Extended existing `searchNetworkAction` with **messages** (Connect workspace ILIKE search, auth + business membership required).
- `NetworkSearchPage` messages tab with conversation deep links.

### Global Activity
- Read path for `atlas_network_activities` via `fetchGlobalActivityAction`, `fetchProfileActivityAction`, `fetchCompanyActivityAction`.
- `ActivityItem` + `activity-presenter` resolve links to posts (`/atlas#post-{id}`), jobs, events, products, stores, company profiles.

### Company Connections
- Company profile **Activity** tab alongside existing posts, products, services, events, jobs, team tabs.

### Feed Connections
- Activity presenter links product/job/event posts to canonical routes; no second feed created.

### Notifications
- `resolveAtlasNotificationHref` covers jobs, events, posts, profiles, companies, marketplace, orders, invoices, wallet (NXR), messages.

### Permissions
- Guest browse preserved; auth-gated nav items still use `NexarCommerceAuthProvider` modal (no guest redirects).

---

## Remaining Work Before Production Polish

1. **Connect messaging backend** — `MessagingInterface` still receives empty conversations; wire `modules/atlas-connect` list/send when product-ready.
2. **Post detail route** — `/atlas/posts/[id]` for cleaner notification/activity links (currently `#post-{id}` on feed).
3. **Personalized activity feed** — global activity is platform-wide; follower-scoped timeline read from `atlas_network_timeline_entries` not yet implemented.
4. **Reaction/comment activity writers** — types exist but not all social actions record activities yet.
5. **Orphan nav components** — `AtlasSidebar`, `AtlasNavbar`, `AtlasTopNav` remain unused; safe removal in polish pass.
6. **Double header on `/atlas`** — global `Navbar` + `AtlasAppBar` coexist; consolidate in polish.
7. **`/atlas/modules` hrefs** — module cards still point to legacy `/merchant` routes; map to `/dashboard/*` or `/atlas/*` in a follow-up.
8. **Notification read state** — ATLAS notifications page does not yet mark items read on click (merchant/customer centers do via `NotificationCenter`).

---

## Verification

```bash
npm run typecheck   # ✅ pass
```

**Not run:** `npm run build` (per sprint instructions).

---

## Architecture Compliance

- ✅ Extended existing modules only — no parallel APIs, tables, or feeds
- ✅ Reused repositories, services, and routes
- ✅ Did not touch Homepage, Presale, Wallet contracts, Auth/Marketplace/Business/AI backends
- ✅ RBAC and guest-gate patterns preserved
