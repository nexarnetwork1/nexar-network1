# Phase 2 — Merchant & Catalog

## Database

Apply migration:

```bash
supabase db push
```

Creates:
- `products` — catalog with full-text search
- `carts` / `cart_items` — one cart per customer
- `product-images` storage bucket

## Merchant Routes

| Route | Purpose |
|---|---|
| `/merchant/products` | Product list |
| `/merchant/products/new` | Create product |
| `/merchant/products/[id]/edit` | Edit product |
| `/merchant/store` | Store settings (read-only for now) |

Merchants can manage products once their store exists. Products are visible in the marketplace only when:
- Store `status = active`
- Store `mode = marketplace`
- Product `is_active = true`

## Customer Routes

| Route | Purpose |
|---|---|
| `/customer/browse` | Search and browse marketplace products |
| `/customer/browse/[id]` | Product detail |
| `/customer/cart` | Shopping cart |

## Activate a Store (Admin)

```sql
UPDATE public.stores SET status = 'active' WHERE slug = 'your-store-slug';
```

## Search

Products use PostgreSQL full-text search on name and description via the `q` query parameter on `/customer/browse`.
