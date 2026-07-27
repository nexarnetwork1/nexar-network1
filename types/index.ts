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
  | "paid"
  | "expired"
  | "failed";

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

export type Product = {
  id: string;
  store_id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image_url: string | null;
  stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductWithStore = Product & {
  store: Pick<Store, "id" | "name" | "slug" | "logo_url">;
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
