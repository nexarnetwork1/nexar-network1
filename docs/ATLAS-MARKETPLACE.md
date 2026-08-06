# ATLAS Marketplace — Commerce Engine

**Sales channel of ATLAS by NEXAR NETWORK**

> Marketplace is **not** the platform. It is one capability inside ATLAS.  
> Every product belongs to **Business**. Marketplace only discovers, promotes, and sells.

---

## Mission

Every Business automatically owns a Marketplace Storefront. Listings are **channel projections** over Product masters — never a second product table of truth.

---

## Architecture

| Layer | Location |
|-------|----------|
| Bounded context | `marketplace` (kept — not renamed) |
| Pillar module | `modules/atlas-marketplace/` |
| Legacy adapters | `modules/marketplace/**` (cart, wishlist, storefront UI adapters) |
| Database | `atlas_marketplace_*` + existing commerce tables |
| Port | `AtlasMarketplacePort` |

### Ownership (charter)

| Aggregate | Owner |
|-----------|--------|
| Product, Store | `businessHub` |
| Order, OrderItem | `orders` |
| Listing, Storefront, Cart, Wishlist, Checkout, Shipment, Offer, Campaign… | `marketplace` |
| Brand, Category | `catalog` (read by marketplace) |

---

## Root Entities

| Entity | Implementation |
|--------|----------------|
| MarketplaceStorefront | `atlas_marketplace_storefronts` |
| MarketplaceListing | `atlas_marketplace_listings` → `product_id` FK |
| Offer / FlashSale / Campaign / Collection | `atlas_marketplace_*` |
| Checkout | `atlas_marketplace_checkouts` → refs cart/order |
| Shipment | `atlas_marketplace_shipments` → refs order |
| Favorite / Recommendation / Advertisement | channel tables |
| Cart / Wishlist / Review | existing tables (`carts`, `wishlist_items`, `product_reviews`) |
| Coupon | existing `coupons` |
| Brand / Category | existing `brands`, `marketplace_categories` |
| Product / Order | **references only** |

### Selling types

`physical` · `digital` · `service` · `rental` · `subscription` · `wholesale` · `auction` · `nft`

---

## Ecosystem hooks

| Module | Integration |
|--------|-------------|
| **Pulse** | `marketplace.listing_published`, `order.placed/paid`, `review.created` → feed |
| **Connect** | Existing marketplace channel + order.paid notifications |
| **Network** | Followers / store social graph (existing store_followers) |
| **AI** | `MARKETPLACE_AI_ACTIONS` stubs — description, SEO, price, fraud, inventory |
| **CRM** | `payment.confirmed` handler signal (customer appear later via CRM module) |

---

## Domain Events

| Event | When |
|-------|------|
| `marketplace.storefront_created` | Storefront provisioned |
| `marketplace.listing_published` | Listing published |
| `marketplace.offer_created` | Offer created |
| `marketplace.collection_created` | Collection created |
| `marketplace.checkout_started` / `completed` | Checkout lifecycle |
| `marketplace.shipment_created` / `updated` | Fulfillment |
| `marketplace.favorite_added` | Favorite |
| `marketplace.advertisement_created` | Sponsored placement |
| `marketplace.review_added` | Cataloged (emit from review module later) |
| `marketplace.refund_requested` | Cataloged |
| `marketplace.business_followed` | Cataloged |

Ingested: `business.created`, `product.created`, `product.published`, `order.placed`, `order.paid`, `payment.confirmed`, `review.created`.

---

## Permissions

`marketplace:storefront:*` · `listing:*` · `offer:manage` · `campaign:manage` · `checkout:create` · `shipment:manage` · `wishlist/favorite` · `review:create` · `advertisement:manage` · `analytics:read` · `search` (+ legacy cart/order/storefront)

---

## API Contract

```typescript
interface AtlasMarketplacePort {
  getStorefront(businessId);
  ensureStorefront(input);
  publishListing(input);  // requires productId for physical goods
  listListings(storefrontId);
  search(input);
  startCheckout(input);
  recommend(input);
}
```

---

## Monetization

Ledger kinds: commission · sponsored_product · sponsored_business · premium_store · premium_analytics · featured_listing

`is_premium` on storefronts; commission recorded on `order.paid` (5% stub rate).

---

## Auto-Provisioning

1. DB trigger on `businesses` INSERT → storefront  
2. DB trigger on `products` INSERT/UPDATE → listing projection  
3. App `ensureMarketplaceStorefront()` from Business Hub + event bus  

---

## UI Roadmap

1. Storefront home  
2. Listing / PDP (gallery, variants, AI description)  
3. Cart + checkout  
4. Wishlist / favorites  
5. Offers / flash sales / campaigns  
6. Shipment tracking  
7. Sponsored placements  
8. Merchant listing console  
9. Discovery / search  
10. Analytics dashboard  

---

## Related

- [ATLAS Constitution](./ATLAS.md)
- [ATLAS AI](./ATLAS-AI.md)
- [ATLAS Connect](./ATLAS-CONNECT.md)
- [ATLAS Pulse](./ATLAS-PULSE.md)
