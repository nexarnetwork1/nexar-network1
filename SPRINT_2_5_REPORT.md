# Sprint 2.5 — ATLAS Marketplace Integration Report

**Date:** 2026-08-07  
**Status:** Complete  
**Typecheck:** `npm run typecheck` — PASS

## Objective

Connect the existing Nexar Commerce Marketplace with the ATLAS application shell without redesigning Marketplace, duplicating repositories, or creating new database tables.

## Marketplace Integration Completed

### Product posts in ATLAS Feed
- `product.published` domain events now create `post_type: "product"` network posts via `publishProductNetworkPost` (`modules/atlas-network/service.ts`, `events.ts`).
- Posts dedupe on `metadata.productId` per business.
- `FeedPostCard` renders product posts with image, price, and link to `/marketplace/products/{handle}`.

### Company page
- Products tab uses `MarketplaceListingCard` (wraps existing `StorefrontProductCard`).
- Featured, top-selling, and latest product sections preserved.
- Store info block shows tagline, listing count, followers, and link to commerce store.
- Company header **Store** button fixed: `MARKETPLACE_ROUTES.store(slug)` (was broken `/store/{slug}`).

### Store page navigation
- `/marketplace/shop?store={slug}` includes `AtlasCommerceNav` with back-link to company ATLAS profile when storefront resolves.
- Store page title reflects merchant name when filtering by store.

### Search
- Extended `searchNetworkSchema` and `searchNetworkAction` for **products** and **stores**.
- Reuses `searchListings`, `searchStorefronts`, `enrichListingsWithProducts` from `atlas-marketplace/repository`.
- `NetworkSearchPage` adds Products and Stores filter tabs with listing cards and store rows.

### Profile
- Person profiles show owned business products at the top of the **Posts** tab (no new tab).
- Uses `fetchProfileProductsAction` + `MarketplaceListingCard`.

### Navigation
- `AtlasCommerceNav` cross-links Feed ↔ ATLAS Marketplace ↔ Commerce Shop ↔ Search ↔ Company.
- ATLAS marketplace page (`/atlas/marketplace`) includes nav + link to full shop.
- `MarketplaceSubNav` adds ATLAS Feed and ATLAS Marketplace links.

### Listing URL correctness
- `enrichListingsWithProducts` joins commerce `products.slug` and `image_url` for correct product detail URLs.
- Shared helper: `lib/atlas/marketplace-links.ts` (`listingProductHref`, `listingToStorefrontProduct`).

## Files Modified

| File | Change |
|------|--------|
| `modules/atlas-marketplace/types.ts` | `EnrichedMarketplaceListing` type |
| `modules/atlas-marketplace/repository.ts` | `enrichListingsWithProducts`, `searchStorefronts`, `getStorefrontBySlug` |
| `modules/atlas-network/validators.ts` | Post metadata; search types `products`, `stores` |
| `modules/atlas-network/service.ts` | Post metadata passthrough; `publishProductNetworkPost` |
| `modules/atlas-network/events.ts` | `product.published` → feed product post |
| `modules/atlas-network/actions.ts` | Enriched company products; extended search; `fetchProfileProductsAction` |
| `lib/atlas/marketplace-links.ts` | **New** — listing URL + card adapter |
| `components/atlas/marketplace/MarketplaceListingCard.tsx` | **New** — reuses `StorefrontProductCard` |
| `components/atlas/marketplace/AtlasCommerceNav.tsx` | **New** — cross-app navigation |
| `components/atlas/app/feed/FeedPostCard.tsx` | Product post preview block |
| `components/atlas/app/company/CompanyProfileHeader.tsx` | Fixed store URL |
| `components/atlas/app/company/CompanyProfileView.tsx` | Listing cards, store info |
| `components/atlas/app/network/NetworkSearchPage.tsx` | Products & stores search UI |
| `components/atlas/app/profile/ProfileView.tsx` | Owned products in posts tab |
| `app/atlas/marketplace/page.tsx` | Nav + shop link |
| `app/marketplace/shop/page.tsx` | ATLAS nav + company back-link |
| `components/marketplace/MarketplaceSubNav.tsx` | ATLAS cross-links |

## Repositories Reused (no duplicates)

| Repository / module | Usage |
|---------------------|--------|
| `modules/atlas-marketplace/repository` | `listPublishedListings`, `searchListings`, `searchStorefronts`, `getStorefrontByBusinessId`, `getStorefrontBySlug`, `getListingByProductId`, `enrichListingsWithProducts` |
| `modules/marketplace/storefront/repository` | Shop search (unchanged) |
| `modules/marketplace/shared/constants` | `MARKETPLACE_ROUTES` |
| `modules/atlas-network/repository` | Posts, profiles, search, `getNetworkProfileByBusinessId` |
| `modules/business-hub/repository` | `getBusinessesForUser`, `listBusinessMembers` |
| `lib/commerce/home-loader` | ATLAS marketplace product grid data |

## Components Reused (no duplicates)

- `StorefrontProductCard` — via `MarketplaceListingCard` adapter
- `MarketplaceGrid` — ATLAS marketplace page
- `FeedPostCard` — feed + company/service posts
- `ShopSearchView` — commerce store browse
- `MarketplaceSubNav` — extended, not replaced

## Out of Scope (untouched)

Homepage, Presale, Wallet, Authentication, Messaging, Notifications, Jobs, Events, AI module internals.

## Remaining Integration Work

1. **Manual product posts** — `PostComposer` does not yet expose a “Share product” picker; only auto-posts on `product.published`.
2. **Product detail back-nav** — `/marketplace/products/{handle}` could show `AtlasCommerceNav` with merchant company link (needs product → business → network profile join on detail page).
3. **ATLAS marketplace grid** — still loads via `loadCommerceHomeData` (commerce catalog); optional future: blend `atlas_marketplace_listings` for network-native discovery.
4. **Store slug ↔ network slug alignment** — back-links depend on `atlas_marketplace_storefronts.slug` matching shop filter; legacy stores without storefront rows won't get company links until provisioned.
5. **Historical products** — existing published products before this sprint won't have feed posts until republished or a one-time backfill job runs.
6. **Service listing cards** — services reuse product card styling; dedicated service card treatment optional.

## Quality

- No new database tables or migrations.
- No Marketplace V2 or duplicate APIs.
- TypeScript strict check passes.
