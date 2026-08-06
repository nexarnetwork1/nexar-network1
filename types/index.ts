export type UserRole =
  | "customer"
  | "merchant"
  | "business"
  | "admin"
  | "super_admin"
  | "platform_owner";

export type StoreMode = "marketplace" | "payments_only";
export type StoreStatus = "pending" | "active" | "suspended";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "expired"
  | "cancelled"
  | "refunded";

export type FulfillmentStatus = "pending" | "processing" | "shipped" | "delivered";

export type ReviewStatus = "pending" | "approved" | "rejected" | "flagged";

export type ReportTarget = "product" | "store" | "product_review" | "store_review";

export type InvoiceStatus =
  | "draft"
  | "pending"
  | "paid"
  | "expired"
  | "cancelled";

export type PaymentSessionStatus =
  | "waiting"
  | "pending"
  | "waiting_confirmation"
  | "confirmed"
  | "paid"
  | "completed"
  | "expired"
  | "cancelled"
  | "refunded"
  | "failed";

export type WalletOwnerType = "customer" | "merchant" | "platform" | "treasury";

export type WalletTxType =
  | "deposit"
  | "withdrawal"
  | "payment_in"
  | "payment_out"
  | "fee_collection"
  | "refund"
  | "adjustment";

export type WalletTxStatus = "pending" | "confirmed" | "failed" | "reversed";

export type QrCodeType = "marketplace" | "payment_only";

export type NotificationType =
  | "order"
  | "payment"
  | "invoice"
  | "promotion"
  | "security"
  | "system"
  | "dispute"
  | "withdrawal"
  | "verification"
  | "escrow"
  | "refund";

export type SecurityEventType =
  | "failed_login"
  | "blocked_ip"
  | "rate_limit"
  | "invalid_token"
  | "permission_denied"
  | "suspicious_activity";

export type CurrencyKind = "fiat" | "crypto";

export type PaymentMethod = "crypto" | "card";

export type SettlementStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export type TransferType = "platform_fee" | "merchant_payout";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  wallet_address: string | null;
  profile_completed: boolean;
  single_session_enabled?: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type PlatformSettings = {
  id: string;
  treasury_wallet_address: string | null;
  nxr_token_address: string | null;
  usdt_token_address: string | null;
  support_email: string;
  card_provider: string;
  card_platform_fee_percent: number;
  maintenance_mode: boolean;
  platform_status: "operational" | "degraded" | "maintenance";
  min_payment_usd: number | null;
  max_payment_usd: number | null;
  email_notifications_enabled: boolean;
  telegram_notifications_enabled: boolean;
  merchant_promotion_discount_percent: number;
  merchant_promotion_duration_days: number;
  updated_at: string;
  updated_by: string | null;
};

export type AuditLog = {
  id: string;
  actor_id: string | null;
  actor_role: UserRole | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type Store = {
  id: string;
  owner_id: string;
  /** Business Hub parent — nullable only for legacy rows during migration. */
  business_id: string | null;
  name: string;
  slug: string;
  business_type: string | null;
  logo_url: string | null;
  mode: StoreMode;
  status: StoreStatus;
  wallet_address: string;
  created_at: string;
  updated_at: string;
};

export type StoreMarketplaceProfile = {
  banner_url?: string | null;
  description?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  accent_color?: string | null;
  favicon_url?: string | null;
  typography?: string | null;
  button_style?: string | null;
  border_radius?: string | null;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
  telegram?: string | null;
  discord?: string | null;
  business_phone?: string | null;
  business_email?: string | null;
  business_address?: string | null;
  business_hours?: Record<string, string> | null;
  country?: string | null;
  language?: string | null;
  timezone?: string | null;
  featured?: boolean;
  policies?: string | null;
  privacy_policy?: string | null;
  refund_policy?: string | null;
  shipping_policy?: string | null;
  terms?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  og_image?: string | null;
  canonical_url?: string | null;
};

export type StoreSettings = {
  id: string;
  store_id: string;
  notification_email: string | null;
  auto_accept_orders: boolean;
  min_order_amount_usd: number;
  default_currency: string;
  accepts_crypto: boolean;
  accepts_card: boolean;
  marketplace_profile?: StoreMarketplaceProfile;
  created_at: string;
  updated_at: string;
};

export type StoreDirectoryEntry = Store & {
  settings: Pick<StoreSettings, "accepts_crypto" | "accepts_card" | "default_currency" | "marketplace_profile"> | null;
  product_count: number;
  sales_count: number;
  rating: number;
  verification_status: string | null;
  is_top_seller: boolean;
};

export type MerchantPromotion = {
  id: string;
  store_id: string;
  promotion_type: string;
  discount_percent: number;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductCategory = {
  id: string;
  store_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Inventory = {
  id: string;
  product_id: string;
  quantity_on_hand: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
};

export type ProductSpecifications = Record<string, string | number | boolean | null>;

export type Product = {
  id: string;
  store_id: string;
  /** Business Hub tenancy — nullable only for legacy rows during migration. */
  business_id?: string | null;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  currency: string;
  image_url: string | null;
  stock: number;
  category_id: string | null;
  marketplace_category_id?: string | null;
  is_active: boolean;
  is_on_sale?: boolean;
  specifications?: ProductSpecifications;
  slug?: string | null;
  brand_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductWithStore = Product & {
  store: Pick<Store, "id" | "name" | "slug" | "logo_url">;
};

export type ProductWithDetails = ProductWithStore & {
  images: ProductImage[];
};

export type Cart = {
  id: string;
  customer_id: string;
  created_at: string;
  updated_at: string;
};

export type CartItem = {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
};

export type CartItemWithProduct = CartItem & {
  product: ProductWithStore;
};

export type Order = {
  id: string;
  customer_id: string;
  store_id: string;
  status: OrderStatus;
  fulfillment_status?: FulfillmentStatus;
  subtotal: number;
  platform_fee: number;
  merchant_amount: number;
  discount_amount?: number;
  currency: string;
  payment_method: PaymentMethod | null;
  merchant_wallet_snapshot: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
};

export type Invoice = {
  id: string;
  invoice_number: string;
  order_id: string;
  customer_id: string;
  store_id: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  pdf_path: string | null;
  description?: string | null;
  share_token?: string | null;
  issued_at: string;
  due_at: string;
  paid_at: string | null;
};

export type OrderWithDetails = Order & {
  store: Pick<Store, "id" | "name" | "slug">;
  items: OrderItem[];
  invoice: Invoice | null;
};

export type InvoiceWithDetails = Invoice & {
  order: Order;
  store: Pick<Store, "id" | "name" | "slug">;
  customer: Pick<Profile, "id" | "full_name" | "email">;
  items?: InvoiceItem[];
};

export type PaymentSession = {
  id: string;
  invoice_id: string;
  order_id: string;
  status: PaymentSessionStatus;
  method: string;
  amount: number;
  currency: string;
  amount_usd: number;
  deposit_address: string | null;
  qr_payload: string | null;
  expires_at: string;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Settlement = {
  id: string;
  payment_session_id: string;
  order_id: string;
  gross_amount: number;
  platform_fee: number;
  merchant_amount: number;
  fee_rate_applied: number;
  promotion_id: string | null;
  currency: string;
  status: SettlementStatus;
  created_at: string;
  completed_at: string | null;
};

export type NavItem = {
  label: string;
  href: string;
};

export type CustomerProfile = {
  id: string;
  profile_id: string;
  preferred_currency: string;
  total_orders: number;
  total_spent_usd: number;
  created_at: string;
  updated_at: string;
};

export type MerchantProfile = {
  id: string;
  profile_id: string;
  business_name: string | null;
  tax_id: string | null;
  verification_status:
    | "pending"
    | "under_review"
    | "verified"
    | "rejected"
    | "suspended"
    | "blacklisted";
  verification_level: MerchantVerificationLevel;
  kyc_provider: string | null;
  kyc_reference: string | null;
  verified_at: string | null;
  blacklisted_at: string | null;
  blacklist_reason: string | null;
  total_revenue_usd: number;
  total_orders: number;
  created_at: string;
  updated_at: string;
};

export type Wallet = {
  id: string;
  owner_type: WalletOwnerType;
  owner_id: string | null;
  address: string | null;
  chain_id: number;
  label: string | null;
  is_primary: boolean;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type WalletTransaction = {
  id: string;
  wallet_id: string;
  tx_type: WalletTxType;
  amount: number;
  currency: string;
  balance_after: number | null;
  reference_type: string | null;
  reference_id: string | null;
  tx_hash: string | null;
  status: WalletTxStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SupportedCurrency = {
  id: string;
  code: string;
  name: string;
  symbol: string;
  kind: CurrencyKind;
  decimals: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PaymentMethodRecord = {
  id: string;
  code: string;
  name: string;
  kind: CurrencyKind;
  provider: string | null;
  is_active: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type QrCode = {
  id: string;
  store_id: string;
  qr_type: QrCodeType;
  secret_token: string;
  payload: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  read_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SecurityLog = {
  id: string;
  event_type: SecurityEventType;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  created_at: string;
  updated_at: string;
};

export type PaymentStatusHistory = {
  id: string;
  payment_session_id: string;
  from_status: PaymentSessionStatus | null;
  to_status: PaymentSessionStatus;
  reason: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ContactMessageStatus = "new" | "read" | "replied" | "archived";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type EscrowStatus = "pending" | "held" | "released" | "refunded" | "cancelled";

export type Escrow = {
  id: string;
  order_id: string;
  payment_session_id: string | null;
  settlement_id: string | null;
  store_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  status: EscrowStatus;
  release_conditions: Record<string, unknown>;
  held_at: string | null;
  released_at: string | null;
  refunded_at: string | null;
  cancelled_at: string | null;
  released_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DisputeStatus =
  | "open"
  | "under_review"
  | "awaiting_info"
  | "approved"
  | "rejected"
  | "resolved"
  | "closed";

export type Dispute = {
  id: string;
  order_id: string;
  escrow_id: string | null;
  customer_id: string;
  store_id: string;
  status: DisputeStatus;
  reason: string;
  resolution: string | null;
  refund_amount: number | null;
  resolved_by: string | null;
  resolved_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type DisputeMessage = {
  id: string;
  dispute_id: string;
  sender_id: string;
  sender_role: UserRole;
  message: string;
  created_at: string;
};

export type DisputeEvidence = {
  id: string;
  dispute_id: string;
  uploaded_by: string;
  file_url: string;
  file_type: string | null;
  description: string | null;
  created_at: string;
};

export type MerchantVerificationLevel = "basic" | "business" | "enterprise";

export type WithdrawalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "processing"
  | "completed"
  | "cancelled";

export type WithdrawalRequest = {
  id: string;
  merchant_id: string;
  store_id: string;
  amount: number;
  currency: string;
  wallet_address: string;
  chain_id: number;
  status: WithdrawalStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  tx_hash: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CouponType = "percentage" | "fixed" | "free_shipping";
export type CouponScope = "merchant" | "platform";

export type Coupon = {
  id: string;
  code: string;
  coupon_type: CouponType;
  coupon_scope: CouponScope;
  store_id: string | null;
  value: number;
  currency: string;
  usage_limit: number | null;
  used_count: number;
  min_order_usd: number;
  is_active: boolean;
  expires_at: string | null;
  created_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type WebhookEvent =
  | "payment.success"
  | "payment.failure"
  | "refund"
  | "order.created"
  | "invoice.paid";

export type MerchantWebhook = {
  id: string;
  store_id: string;
  url: string;
  secret_prefix: string;
  events: WebhookEvent[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type WebhookDeliveryStatus = "pending" | "delivered" | "failed" | "retrying";

export type SettlementReportPeriod = "daily" | "weekly" | "monthly";

export type SettlementReport = {
  id: string;
  store_id: string | null;
  period_type: SettlementReportPeriod;
  period_start: string;
  period_end: string;
  metrics: SettlementReportMetrics;
  generated_by: string | null;
  generated_at: string;
};

export type SettlementReportMetrics = {
  gross_revenue: number;
  platform_fees: number;
  net_revenue: number;
  refunds: number;
  escrow_balance: number;
  completed_orders: number;
  failed_payments: number;
};

export type SupportedChain = {
  chain_id: number;
  name: string;
  symbol: string;
  rpc_url: string | null;
  explorer_url: string | null;
  is_active: boolean;
  fee_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type SearchResult = {
  type: string;
  id: string;
  title: string;
  ref: string;
};

export type NotificationPreference = {
  id: string;
  user_id: string;
  channel: "in_app" | "email" | "sms" | "push" | "telegram";
  event_type: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

export type TickerAnnouncement = {
  id: string;
  message: string;
  is_enabled: boolean;
  sort_order: number;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductReview = {
  id: string;
  product_id: string;
  store_id: string;
  customer_id: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  body: string;
  images: string[];
  status: ReviewStatus;
  merchant_reply: string | null;
  merchant_reply_at: string | null;
  is_verified_purchase: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
  customer?: Pick<Profile, "id" | "full_name" | "avatar_url">;
};

export type StoreReview = {
  id: string;
  store_id: string;
  customer_id: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  body: string;
  images: string[];
  status: ReviewStatus;
  merchant_reply: string | null;
  merchant_reply_at: string | null;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
  customer?: Pick<Profile, "id" | "full_name" | "avatar_url">;
};

export type WishlistItem = {
  id: string;
  customer_id: string;
  product_id: string;
  created_at: string;
  product?: ProductWithStore;
};

export type StoreTrustMetrics = {
  store_id: string;
  years_active: number;
  total_orders: number;
  total_reviews: number;
  avg_rating: number;
  response_rate: number;
  avg_response_hours: number | null;
};

export type ContentReport = {
  id: string;
  reporter_id: string;
  target_type: ReportTarget;
  target_id: string;
  reason: string;
  details: string | null;
  status: "pending" | "reviewed" | "dismissed" | "actioned";
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type MerchantAnalytics = {
  revenue: number;
  orders: number;
  customers: number;
  products: number;
  conversionRate: number;
  revenueByDay: { date: string; revenue: number }[];
  ordersByCurrency: { currency: string; count: number; revenue: number }[];
  topProducts: { id: string; name: string; units: number; revenue: number }[];
  bestCustomers: { id: string; name: string; orders: number; spent: number }[];
  latestOrders: OrderWithDetails[];
};
