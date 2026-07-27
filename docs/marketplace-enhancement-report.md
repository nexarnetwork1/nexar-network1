# Marketplace UX Enhancement Report

**Date:** 2026-07-27  
**Scope:** Store directory, storefront, product grid, search/filters, cart, payment branding, merchant customization — without removing existing routes or backend architecture.

---

## Summary

The Marketplace module was enhanced end-to-end while reusing existing catalog, cart, checkout, and payment flows. A new `marketplace_profile` JSON column extends `store_settings` for storefront customization without restructuring the database.

---

## Completed Enhancements

### Store Directory (`/marketplace/stores`)
- Professional store cards: banner, logo, name, description, verification badge, rating, product/sales counts, payment logos, Visit Store CTA
- Sorting: Featured, Top Rated, Best Selling, Newest, Alphabetical
- Search by store name and category
- Featured stores section

### Public Storefront (`/store/[slug]`)
- Banner, logo, verification & top-seller badges
- Rating, product count, sales, joined date
- Payment method logos (NXR uses official `/logo.png`)
- Tabs: Products, About, Reviews, Policies, Contact
- Follow store & share (client-side)
- Product grid via enhanced `ProductCard`

### Product Grid & Details
- Reusable `ProductCard`: image, price with currency logo, merchant logo/name, stock, sale/new badges, wishlist, share, add to cart, view details
- Enhanced product detail: gallery, currency logo, SKU, visit store, related products, recently viewed tracking

### Search & Filters (`/customer/browse`)
- Extended filters: category, price range, currency, in-stock, on sale, sort (newest/featured/best selling/price/name)
- Featured stores strip
- Link to store directory

### Shopping Cart
- Merchant logos on line items
- Currency logos on prices
- Enhanced summary: subtotal, fees, discounts, shipping, tax placeholders, grand total

### Payment Branding
- `CurrencyLogo` — NXR uses official Nexar logo; crypto/fiat SVG badges
- `PaymentMethodLogo` — Visa, Mastercard, Apple Pay, Google Pay, crypto
- Applied to product cards, cart, store pages, product detail

### Merchant Store Customization
- `StoreMarketplaceProfileForm` on `/merchant/store`
- Banner URL, colors, description, website, social links, contact info, hours, featured flag
- Stored in `store_settings.marketplace_profile`

### Client-Side Features
- Wishlist (`useWishlist` — localStorage)
- Recently viewed (`useRecentlyViewed`)
- Follow store (`useFollowStore`)
- Product & store share (Web Share API / clipboard)

### Navigation
- Marketplace nav → `/marketplace/stores`
- `/marketplace` redirect preserved for customer browse entry

---

## New Files

| Path | Purpose |
|------|---------|
| `supabase/migrations/20260727000022_marketplace_profile.sql` | `marketplace_profile` JSONB + public read policy |
| `modules/marketplace/repository.ts` | Store directory, public profile, featured stores |
| `components/marketplace/StoreCard.tsx` | Store directory card |
| `components/marketplace/ProductCard.tsx` | Enhanced product card |
| `components/marketplace/StorefrontClient.tsx` | Tabbed public storefront |
| `components/marketplace/ProductDetailClient.tsx` | Recently viewed + related |
| `components/payments/CurrencyLogo.tsx` | Currency branding |
| `components/payments/PaymentMethodLogo.tsx` | Payment method branding |
| `components/merchant/StoreMarketplaceProfileForm.tsx` | Merchant customization |
| `app/marketplace/stores/page.tsx` | Store directory page |
| `hooks/useWishlist.ts`, `useRecentlyViewed.ts`, `useFollowStore.ts` | Client features |
| `lib/constants/payment-branding.ts` | Branding metadata |

---

## Preserved (Unchanged)

- All existing routes (`/customer/browse`, `/customer/cart`, checkout flow, `/market`)
- Catalog/cart/checkout APIs and server actions
- Database tables (additive migration only)
- Payment and invoice generation pipeline

---

## Known Limitations

- Ratings derived from sales volume (no review table yet)
- Wishlist/follow/recently viewed are client-local (not synced across devices)
- Shipping/tax/coupon lines in cart are UI-ready placeholders
- Reviews tab shows order-trust message until full review system ships
- Banner upload via URL (no file upload UI yet — uses existing storage pattern)

---

## Deploy

```bash
supabase db push   # migration 022
npm run typecheck
```
