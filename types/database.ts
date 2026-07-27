// ============================================================
// NEXAR NETWORK - DATABASE TYPES
// Phase 5: Core Platform Implementation
// ============================================================

// ============================================================
// USERS & AUTHENTICATION
// ============================================================

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string | null;
  is_active: boolean;
  is_verified: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface PasswordResetToken {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

// ============================================================
// MERCHANTS
// ============================================================

export interface Merchant {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string | null;
  tax_id: string | null;
  website_url: string | null;
  logo_url: string | null;
  description: string | null;
  status: 'pending' | 'active' | 'suspended' | 'closed';
  is_verified: boolean;
  settlement_currency: string;
  webhook_url: string | null;
  webhook_secret: string | null;
  support_email: string | null;
  support_phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface MerchantSettings {
  id: string;
  merchant_id: string;
  auto_settlement: boolean;
  settlement_frequency: 'daily' | 'weekly' | 'monthly';
  minimum_settlement_amount: number;
  require_email_confirmation: boolean;
  require_phone_confirmation: boolean;
  allow_partial_payments: boolean;
  payment_timeout_minutes: number;
  max_invoice_amount: number;
  notification_enabled: boolean;
  notification_methods: string[];
  created_at: string;
  updated_at: string;
}

// ============================================================
// API KEYS
// ============================================================

export interface ApiKey {
  id: string;
  merchant_id: string;
  key_name: string;
  key_hash: string;
  key_prefix: string;
  permissions: string[];
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// WALLETS
// ============================================================

export interface Wallet {
  id: string;
  merchant_id: string;
  currency: string;
  address: string;
  is_default: boolean;
  balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// CUSTOMERS
// ============================================================

export interface Customer {
  id: string;
  merchant_id: string;
  email: string | null;
  phone: string | null;
  full_name: string | null;
  metadata: Record<string, any> | null;
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
}

// ============================================================
// INVOICES
// ============================================================

export interface Invoice {
  id: string;
  merchant_id: string;
  customer_id: string | null;
  invoice_number: string;
  description: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled' | 'refunded';
  exchange_rate: number | null;
  crypto_amount: number | null;
  crypto_currency: string | null;
  qr_code_url: string | null;
  payment_url: string | null;
  expires_at: string;
  paid_at: string | null;
  cancelled_at: string | null;
  refunded_at: string | null;
  metadata: Record<string, any> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

// ============================================================
// PAYMENT SESSIONS
// ============================================================

export interface PaymentSession {
  id: string;
  invoice_id: string;
  session_id: string;
  status: 'pending' | 'completed' | 'expired' | 'failed';
  merchant_id: string;
  customer_id: string | null;
  customer_email: string | null;
  wallet_address: string | null;
  supported_currencies: string[];
  selected_currency: string | null;
  exchange_rate: number | null;
  crypto_amount: number | null;
  expires_at: string;
  completed_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// PAYMENTS
// ============================================================

export interface Payment {
  id: string;
  invoice_id: string;
  payment_session_id: string | null;
  merchant_id: string;
  customer_id: string | null;
  transaction_hash: string | null;
  from_address: string | null;
  to_address: string;
  amount: number;
  currency: string;
  confirmations: number;
  required_confirmations: number;
  status: 'pending' | 'confirmed' | 'failed' | 'processing';
  block_number: number | null;
  fee: number;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// RECEIPTS
// ============================================================

export interface Receipt {
  id: string;
  payment_id: string;
  invoice_id: string;
  receipt_number: string;
  receipt_url: string | null;
  amount: number;
  currency: string;
  merchant_name: string | null;
  customer_name: string | null;
  issued_at: string;
  created_at: string;
}

// ============================================================
// LOGS & AUDIT
// ============================================================

export interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  category: string | null;
  message: string;
  metadata: Record<string, any> | null;
  user_id: string | null;
  merchant_id: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  merchant_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  changes: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

// ============================================================
// NEWS & ANNOUNCEMENTS
// ============================================================

export interface News {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  author: string | null;
  published: boolean;
  featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'maintenance' | 'feature';
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================
// EXCHANGE RATES
// ============================================================

export interface ExchangeRate {
  id: string;
  from_currency: string;
  to_currency: string;
  rate: number;
  source: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================
// REQUEST/RESPONSE TYPES
// ============================================================

export interface CreateMerchantRequest {
  business_name: string;
  business_type?: string;
  tax_id?: string;
  website_url?: string;
  description?: string;
  support_email?: string;
  support_phone?: string;
}

export interface CreateInvoiceRequest {
  customer_id?: string;
  customer_email?: string;
  description?: string;
  amount: number;
  currency?: string;
  items?: Array<{
    description: string;
    quantity: number;
    unit_price: number;
  }>;
  expires_in?: number; // minutes
  metadata?: Record<string, any>;
}

export interface CreatePaymentSessionRequest {
  invoice_id: string;
  customer_email?: string;
  supported_currencies?: string[];
}

export interface PaymentResponse {
  payment_id: string;
  invoice_id: string;
  transaction_hash: string | null;
  status: string;
  amount: number;
  currency: string;
  confirmations: number;
  created_at: string;
}

export interface DashboardStats {
  total_revenue: number;
  total_payments: number;
  total_customers: number;
  total_invoices: number;
  pending_invoices: number;
  paid_invoices: number;
  average_order_value: number;
  revenue_this_month: number;
  payments_this_month: number;
}

export interface MerchantWithUser extends Merchant {
  user: User;
  settings?: MerchantSettings;
  wallets?: Wallet[];
}

export interface InvoiceWithMerchant extends Invoice {
  merchant: Merchant;
  customer?: Customer;
  items?: InvoiceItem[];
}

export interface PaymentWithInvoice extends Payment {
  invoice: Invoice;
  merchant: Merchant;
  customer?: Customer;
}
