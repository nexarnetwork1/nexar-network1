export type UserRole = "customer" | "merchant" | "admin";

export type StoreMode = "marketplace" | "payments_only";
export type StoreStatus = "pending" | "active" | "suspended";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "expired"
  | "cancelled"
  | "refunded";

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
  | "system";

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

export type StoreSettings = {
  id: string;
  store_id: string;
  notification_email: string | null;
  auto_accept_orders: boolean;
  min_order_amount_usd: number;
  default_currency: string;
  accepts_crypto: boolean;
  accepts_card: boolean;
  created_at: string;
  updated_at: string;
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

export type Product = {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  stock: number;
  category_id: string | null;
  is_active: boolean;
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
  subtotal: number;
  platform_fee: number;
  merchant_amount: number;
  currency: string;
  payment_method: PaymentMethod | null;
  merchant_wallet_snapshot: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
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
  verification_status: "pending" | "verified" | "rejected" | "suspended";
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
