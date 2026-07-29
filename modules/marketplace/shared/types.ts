import type { Product, ProductWithStore, Store } from "@/types";

/** Public catalog list item — stable shape for storefront APIs. */
export type CatalogProductListItem = ProductWithStore;

/** Product detail aggregate for PDP (images, inventory wired in later). */
export type CatalogProductDetail = ProductWithStore & {
  images?: { url: string; is_primary: boolean; sort_order: number }[];
};

export type CatalogListParams = {
  query?: string;
  collectionSlug?: string;
  storeSlug?: string;
  page?: number;
  limit?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "name";
};

export type CatalogListResult = {
  items: CatalogProductListItem[];
  total: number;
  page: number;
  limit: number;
};

export type StorefrontStore = Pick<
  Store,
  "id" | "name" | "slug" | "logo_url" | "mode" | "status"
>;

export type CartLine = {
  productId: string;
  quantity: number;
};

export type CartSnapshot = {
  id: string;
  customerId: string;
  lines: CartLine[];
  updatedAt: string;
};

export type CheckoutSessionDraft = {
  cartId: string;
  customerId: string;
};
