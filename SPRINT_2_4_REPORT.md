# Sprint 2.4 — Company Ecosystem

**Date:** August 7, 2026  
**Branch:** `authjs-migration`  
**Status:** Complete  
**Typecheck:** `npm run typecheck` — **PASS**

---

## Objective

Turn every Company into a complete business identity inside ATLAS — first-class citizens with profile, feed, follow, employees, products, services, events, jobs, and real analytics summaries.

---

## Scope respected (not modified)

- Homepage, Presale, Wallet, Authentication
- Feed architecture (`SocialFeed`, `FeedPostCard` reused read-only)
- Messaging, Notifications
- Jobs backend, Events backend, Marketplace backend
- Business Dashboard (`/dashboard/business`, `BusinessDashboard.tsx`)

---

## Architecture approach

Extended existing modules and UI — **no parallel implementations**, **no new tables**, **no fake data**.

| Layer | Strategy |
|-------|----------|
| Profile route | Reused `/atlas/network/[slug]` — branches on `subject_type === "business"` |
| Person profiles | Unchanged `ProfileView` person tabs |
| Company profiles | New `CompanyProfileView` delegated from `ProfileView` |
| Feed | Reused `FeedPostCard` + `getNetworkPosts` / `fetchProfilePostsAction` |
| Marketplace | Reused `listPublishedListings({ businessId })` — links to `/marketplace/products/[slug]` |
| Employees | Reused `business_memberships` via new `listBusinessMembers` |
| Events / Jobs | Reused `atlas_network_events`, job posts via `getNetworkPosts({ businessId, postType: "job" })` |
| Analytics | Real counts from `products`, `orders`, `atlas_network_posts`, `atlas_core_analytics_facts` |

---

## Files modified

### Backend

| File | Changes |
|------|---------|
| `modules/business-hub/repository.ts` | `listBusinessMembers`, `countBusinessProducts`, `countBusinessOrders`, `countBusinessAnalyticsViews` |
| `modules/atlas-network/repository.ts` | `getEventsByNetworkProfileId`, `getCompanyAnalyticsSummary` |
| `modules/atlas-network/types.ts` | `CompanyAnalyticsSummary`; extended `NetworkProfileView` with `business`, `analytics` |
| `modules/atlas-network/actions.ts` | `fetchCompanyEmployeesAction`, `fetchCompanyProductsAction`, `fetchCompanyServicesAction`, `fetchCompanyEventsAction`, `fetchCompanyJobsAction`, `fetchCompanyStorefrontAction` |

### UI (new)

| File | Purpose |
|------|---------|
| `components/atlas/app/company/CompanyProfileHeader.tsx` | Company logo, cover, verified badge, industry, contact info, follow, store link |
| `components/atlas/app/company/CompanyProfileView.tsx` | Company tabs: Posts, Products, Services, Events, Jobs, Team, About, Analytics |

### UI (extended)

| File | Changes |
|------|---------|
| `components/atlas/app/profile/ProfileView.tsx` | Delegates to `CompanyProfileView` when `subject_type === "business"` |
| `components/atlas/app/AtlasRightSidebar.tsx` | Trending companies → network profiles; **Suggested Companies** with follow |
| `components/atlas/app/AtlasAppShell.tsx` | Passes `suggestedCompanies`, `networkSlug` on trending |
| `app/atlas/network/[slug]/page.tsx` | Loads business, storefront, members, analytics for company profiles |
| `app/atlas/layout.tsx` | Fetches `getSuggestedCompanies`, resolves network slugs for trending |

---

## Repositories reused

| Module | Functions |
|--------|-----------|
| **Business Hub** | `getBusinessById`, `getActiveBusinesses`, `listBusinessMembers`, `countBusinessProducts`, `countBusinessOrders`, `countBusinessAnalyticsViews` |
| **ATLAS Network** | `getNetworkProfileBySlug`, `getProfileView`, `getNetworkPosts`, `getSuggestedCompanies`, `getNetworkProfileByBusinessId`, `getEventsByNetworkProfileId`, `getCompanyAnalyticsSummary`, `followTarget` (via `FollowButton`) |
| **ATLAS Marketplace** | `getStorefrontByBusinessId`, `listPublishedListings` |
| **ATLAS Core** | `atlas_core_analytics_facts` (view counts) |

---

## Company profile capabilities

| Field | Source |
|-------|--------|
| Company Logo | `avatar_url` / `business.logo_url` |
| Cover Image | `cover_url` |
| Company Name | `display_name` |
| Verified Badge | `verified` + `business.verification_state` |
| Industry | `company.industry` / `business.business_type` |
| Description | `bio` / `business.profile.description` |
| Location | `company.location` / `business.profile.address` |
| Website | `company.website` / `business.profile.website` |
| Email / Phone | `business.profile` JSONB |
| Wallet Address | `profile_data.walletAddress` |
| Followers | `follower_count` + follow actions |
| Employees | `business_memberships` → Team tab |
| Products | Marketplace listings tab |
| Services | Service listings + `post_type: service` posts |
| Marketplace Store | Storefront link → `/store/{slug}` |
| Analytics Summary | Real aggregated stats tab |

---

## Company feed

Reuses existing post system via `FeedPostCard`. Companies publish through the same `atlas_network_posts` table (announcements, product updates, hiring, events, articles, images, videos, polls) — filtered by `author_profile_id` / `business_id`. **No second feed created.**

---

## Marketplace integration status

| Feature | Status |
|---------|--------|
| Featured Products | `listPublishedListings` + `is_featured` filter |
| Latest Products | Default listing order by `published_at` |
| Top Selling | Sorted by `metadata.sales_count` when present |
| Product links | `/marketplace/products/{listing.slug}` |
| Store link | `/store/{storefront.slug}` from `getStorefrontByBusinessId` |
| Services | Listings with `selling_type === "service"` |

**No Marketplace logic duplicated.**

---

## Business integration status

| Feature | Status |
|---------|--------|
| Business record on profile | Loaded via `getBusinessById(profile.business_id)` |
| Employee roles | owner, admin, manager, staff→Member, viewer→Member |
| Profile links for team | Links to `/atlas/network/{network_slug}` when available |
| Owner manage link | `/dashboard/business/profile` |
| Auto-provisioned network slug | `{business.slug}-network` |

---

## Network / follow

| Action | Status |
|--------|--------|
| Follow / Unfollow company | Existing `FollowButton` + `followProfileAction` |
| Followers count | `follower_count` on network profile |
| Suggested companies | `getSuggestedCompanies` wired in layout + sidebar |
| Trending companies | Links to company network profiles |

---

## Analytics (real data only)

| Metric | Source |
|--------|--------|
| Followers | Network profile `follower_count` |
| Employees | Active `business_memberships` count |
| Products | `products` table (`is_active`) |
| Services | Published listings with `selling_type = service` |
| Orders | `orders` via business `stores` |
| Posts | `atlas_network_posts` count |
| Engagement | Sum of comments, shares, reactions on business posts |
| Views | Sum from `atlas_core_analytics_facts` (`view`, `page_view`, `profile_view`) |

---

## Responsive

Existing ATLAS app shell preserved. Company profile uses same max-width, tab scroll, and responsive grid patterns as person profiles.

---

## QA

```bash
npm run typecheck   # PASS (exit 0)
# npm run build     # NOT run per sprint instructions
```

---

## Remaining work (optional, out of sprint scope)

- Company profile edit page on ATLAS (owners currently use `/dashboard/business/profile`)
- Fix `BusinessDashboard` link `/business/{slug}` → `/atlas/network/{slug}-network` (Business Dashboard explicitly out of scope)
- Rich showcase rendering (currently JSON from `company.showcase`)
- Dedicated “Apply” inline on jobs tab (links to existing `/atlas/jobs/[id]`)
- Pulse feed integration on company Posts tab (Pulse module exists; Network posts used first)
- Company-scoped post composer pre-filled with `businessId` from owner context
- Top-selling fallback when `metadata.sales_count` is absent (currently shows all products sorted by 0)

---

*Sprint 2.4 completes the company ecosystem on top of existing Business Hub, ATLAS Network, and Marketplace modules.*
