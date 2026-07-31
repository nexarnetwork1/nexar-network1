import type {
  ProductImage,
  ProductReview,
  ProductWithStore,
} from "@/types";

export type StoreBranding = {
  store_id: string;
  banner_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  tagline: string | null;
  social_links: Record<string, string>;
  policies: string | null;
  featured: boolean;
  updated_at: string;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  sku: string;
  title: string;
  option_values: Record<string, string>;
  price: number;
  compare_at_price: number | null;
  currency: string;
  stock: number;
  is_active: boolean;
  image_url: string | null;
  sort_order: number;
};

export type StorefrontProduct = ProductWithStore & {
  slug?: string | null;
  brand_name?: string | null;
  category_name?: string | null;
  marketplace_category_name?: string | null;
  avg_rating?: number;
  review_count?: number;
};

export type StorefrontProductDetail = StorefrontProduct & {
  images: ProductImage[];
  variants: ProductVariant[];
  reviews: ProductReview[];
  related_products: StorefrontProduct[];
  in_wishlist: boolean;
};

export type ShopFilters = {
  query?: string;
  storeSlug?: string;
  categorySlug?: string;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  sort?: "newest" | "price_asc" | "price_desc" | "rating" | "bestsellers";
  page?: number;
  limit?: number;
};

export type ShopSearchResult = {
  items: StorefrontProduct[];
  total: number;
  page: number;
  limit: number;
  filters: {
    categories: { id: string; name: string; slug: string; count: number }[];
    brands: { id: string; name: string; slug: string; count: number }[];
  };
};
