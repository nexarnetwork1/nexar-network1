# Phase 3 — Orders & Invoices

## Database

```bash
supabase db push
```

Creates:
- `orders`, `order_items`, `invoices`
- `invoice_sequences` for `INV-YYYY-000001` numbering
- `create_store_checkout()` RPC — atomic order + invoice + stock decrement + cart cleanup + audit log
- Private `invoices` storage bucket for PDF files

## Checkout Flow

1. Customer adds items to cart
2. **Proceed to checkout** groups cart items by store
3. One order + invoice created per store via `create_store_checkout`
4. Invoice PDF generated and stored in Supabase Storage
5. Redirect to order detail (single store) or orders list (multi-store)

Fees (`platform_fee`, `merchant_amount`) are calculated at payment time in Phase 4.

## Routes

| Route | Role | Purpose |
|---|---|---|
| `/customer/orders` | Customer | Order list |
| `/customer/orders/[id]` | Customer | Order detail |
| `/customer/invoices` | Customer | Invoice list |
| `/customer/invoices/[id]` | Customer | Invoice detail |
| `/merchant/orders` | Merchant | Store orders |
| `/merchant/invoices` | Merchant | Store invoices |
| `/admin/orders` | Admin | All orders |
| `/admin/invoices` | Admin | All invoices |
| `/api/invoices/[id]/pdf` | Auth | PDF download (RLS-checked) |

## Audit

Every checkout writes an audit log entry via `private.write_audit_log` inside the database function.

No public invoice pages — access is RLS-scoped to customer, merchant (own store), or admin.
