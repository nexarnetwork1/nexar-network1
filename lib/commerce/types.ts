export type LiveMetricsPayload = {
  total_users?: number;
  total_merchants?: number;
  total_customers?: number;
  verified_stores?: number;
  total_products?: number;
  total_orders?: number;
  paid_orders?: number;
  sales_volume_usd?: number;
  nxr_payments?: number;
  usdt_payments?: number;
  countries_active?: number;
  new_stores_7d?: number;
  computed_at?: string;
  marketplace?: MarketplaceStatisticsPayload;
};

export type MarketplaceStatisticsPayload = {
  latest_products: CommerceProduct[];
  trending_products: CommerceProduct[];
  featured_stores: CommerceStore[];
  approved_brands: CommerceBrand[];
  computed_at: string;
};

export type CommerceProduct = {
  id: string;
  name: string;
  slug: string;
  price: number;
  currency: string;
  image_url?: string | null;
  created_at?: string;
  store_id?: string;
  store_name?: string;
  store_slug?: string;
  units_sold?: number;
  revenue?: number;
  avg_rating?: number;
  review_count?: number;
  discount_percent?: number;
};

export type CommerceStore = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  banner_url?: string | null;
  tagline?: string | null;
  featured?: boolean;
  follower_count?: number;
  product_count?: number;
  rating?: number;
  is_verified?: boolean;
};

export type CommerceBrand = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  store_id?: string;
  approved_at?: string | null;
};

/** Approved merchant surfaced on the commerce homepage network carousel. */
export type CommerceMerchantNetworkItem = {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  store_id?: string;
  category?: string | null;
  country_code?: string | null;
  is_verified: boolean;
  approved_at?: string | null;
};

export type CommerceCategory = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  sort_order: number;
  product_count: number;
};

export type CommerceSubscriptionPlan = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  interval_days: number;
  store_id: string;
  store_name?: string;
  store_slug?: string;
};

export type CommerceActivityEvent = {
  id: string;
  activity_type: string;
  store_id?: string | null;
  product_id?: string | null;
  order_id?: string | null;
  brand_id?: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

export type CommerceCountry = {
  code: string;
  name: string;
  region?: string | null;
};

export type CommerceFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type CommerceHomeData = {
  liveMetrics: LiveMetricsPayload;
  marketplace: MarketplaceStatisticsPayload;
  brands: CommerceBrand[];
  merchantNetwork: CommerceMerchantNetworkItem[];
  countries: CommerceCountry[];
  activity: CommerceActivityEvent[];
  categories: CommerceCategory[];
  subscriptionPlans: CommerceSubscriptionPlan[];
  faqItems: CommerceFaqItem[];
  topRatedProducts: CommerceProduct[];
  flashDealProducts: CommerceProduct[];
  activeCountryCodes: string[];
};
