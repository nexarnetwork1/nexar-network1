/**
 * ATLAS Marketplace — domain types.
 * Commerce Engine — sales channel only. Never owns Product/Store masters.
 */

export type MarketplaceSellingType =
  | "physical"
  | "digital"
  | "service"
  | "rental"
  | "subscription"
  | "wholesale"
  | "auction"
  | "nft";

export type MarketplaceListingStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "paused"
  | "archived"
  | "rejected";

export type MarketplaceCheckoutStatus =
  | "open"
  | "processing"
  | "completed"
  | "abandoned"
  | "cancelled";

export type MarketplaceShipmentStatus =
  | "pending"
  | "packed"
  | "shipped"
  | "in_transit"
  | "delivered"
  | "returned"
  | "cancelled";

export type MarketplaceCampaignStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "ended"
  | "cancelled";

export type MarketplaceAdPlacement =
  | "home"
  | "search"
  | "category"
  | "product"
  | "storefront"
  | "pulse";

export type MarketplaceMonetizationKind =
  | "commission"
  | "sponsored_product"
  | "sponsored_business"
  | "premium_store"
  | "premium_analytics"
  | "featured_listing";

export type MarketplacePaymentMethod =
  | "wallet"
  | "card"
  | "bank"
  | "crypto"
  | "nxr"
  | "cash"
  | "split";

export type MarketplaceAiAction =
  | "generate_description"
  | "generate_seo"
  | "suggest_price"
  | "predict_sales"
  | "recommend_products"
  | "detect_fraud"
  | "optimize_inventory";

export type MarketplaceStorefront = {
  id: string;
  business_id: string;
  store_id: string | null;
  slug: string;
  display_name: string;
  tagline: string | null;
  is_premium: boolean;
  is_published: boolean;
  follower_count: number;
  listing_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type MarketplaceListing = {
  id: string;
  storefront_id: string;
  business_id: string;
  product_id: string | null;
  selling_type: MarketplaceSellingType;
  status: MarketplaceListingStatus;
  title: string;
  slug: string;
  summary: string | null;
  ai_description: string | null;
  price: number | null;
  currency: string;
  compare_at_price: number | null;
  is_featured: boolean;
  is_sponsored: boolean;
  category_id: string | null;
  collection_id: string | null;
  brand_id: string | null;
  published_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type MarketplaceOffer = {
  id: string;
  storefront_id: string;
  listing_id: string | null;
  title: string;
  discount_percent: number | null;
  discount_amount: number | null;
  starts_at: string;
  ends_at: string | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type MarketplaceFlashSale = {
  id: string;
  storefront_id: string | null;
  business_id: string | null;
  title: string;
  starts_at: string;
  ends_at: string;
  status: MarketplaceCampaignStatus;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type MarketplaceCampaign = {
  id: string;
  business_id: string | null;
  storefront_id: string | null;
  name: string;
  slug: string;
  status: MarketplaceCampaignStatus;
  starts_at: string | null;
  ends_at: string | null;
  budget: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type MarketplaceCollection = {
  id: string;
  storefront_id: string | null;
  business_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  is_public: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type MarketplaceCheckout = {
  id: string;
  business_id: string | null;
  storefront_id: string | null;
  buyer_user_id: string | null;
  cart_id: string | null;
  order_id: string | null;
  status: MarketplaceCheckoutStatus;
  payment_method: MarketplacePaymentMethod | null;
  coupon_code: string | null;
  subtotal: number | null;
  discount_total: number;
  total: number | null;
  currency: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type MarketplaceShipment = {
  id: string;
  order_id: string;
  business_id: string | null;
  status: MarketplaceShipmentStatus;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type MarketplaceRecommendation = {
  id: string;
  user_id: string | null;
  listing_id: string;
  reason: string | null;
  score: number;
  context: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type MarketplaceAdvertisement = {
  id: string;
  business_id: string;
  listing_id: string | null;
  storefront_id: string | null;
  placement: MarketplaceAdPlacement;
  title: string;
  starts_at: string;
  ends_at: string | null;
  budget: number | null;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

/** Legacy channel tables referenced (not owned as masters). */
export const MARKETPLACE_CONSUMES = [
  "Business",
  "Store",
  "Product",
  "Order",
  "OrderItem",
  "Brand",
  "Category",
  "Coupon",
  "Cart",
  "Wishlist",
  "Review",
] as const;

export const MARKETPLACE_EVENT_HANDLERS: Record<
  string,
  { action: "provision" | "listing" | "pulse" | "connect" | "crm"; description: string }
> = {
  "business.created": { action: "provision", description: "Ensure storefront" },
  "product.published": { action: "listing", description: "Ensure published listing" },
  "product.created": { action: "listing", description: "Ensure draft listing" },
  "order.placed": { action: "pulse", description: "Order activity → Pulse" },
  "order.paid": { action: "connect", description: "Sale → Connect + Pulse" },
  "payment.confirmed": { action: "crm", description: "Customer → CRM signal" },
  "review.created": { action: "pulse", description: "Review → Pulse" },
};

export type EnsureStorefrontInput = {
  businessId: string;
  ownerUserId: string;
  displayName: string;
  slug: string;
  storeId?: string;
};

export type PublishListingInput = {
  storefrontId: string;
  businessId: string;
  productId?: string;
  sellingType: MarketplaceSellingType;
  title: string;
  slug: string;
  summary?: string;
  price?: number;
  currency?: string;
  categoryId?: string;
  brandId?: string;
  actorUserId: string;
};

export type CreateCheckoutInput = {
  buyerUserId: string;
  storefrontId?: string;
  businessId?: string;
  cartId?: string;
  paymentMethod?: MarketplacePaymentMethod;
  couponCode?: string;
  subtotal?: number;
  discountTotal?: number;
  total?: number;
  currency?: string;
};
