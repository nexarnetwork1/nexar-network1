// ============================================================
// NEXAR NETWORK - DATABASE SERVICE
// Phase 5: Core Platform Implementation
// ============================================================

import { supabaseAdmin as supabase } from '@/lib/supabase/client';
import type {
  User,
  Session,
  Merchant,
  MerchantSettings,
  ApiKey,
  Wallet,
  Customer,
  Invoice,
  InvoiceItem,
  PaymentSession,
  Payment,
  Receipt,
  SystemLog,
  AuditLog,
  News,
  Announcement,
  ExchangeRate,
  CreateMerchantRequest,
  CreateInvoiceRequest,
  CreatePaymentSessionRequest,
  DashboardStats,
} from '@/types/database';

// ============================================================
// ERROR HANDLING
// ============================================================

export class DatabaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// ============================================================
// USER OPERATIONS
// ============================================================

export const userService = {
  async createUser(data: {
    email: string;
    password_hash: string;
    full_name?: string;
  }): Promise<User> {
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: data.email,
        password_hash: data.password_hash,
        full_name: data.full_name || null,
      })
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    return user;
  },

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('email', email)
      .single();

    if (error) return null;
    return data;
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const { data: user, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    return user;
  },

  async updateLastLogin(id: string): Promise<void> {
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', id);
  },
};

// ============================================================
// SESSION OPERATIONS
// ============================================================

export const sessionService = {
  async createSession(data: {
    user_id: string;
    token: string;
    expires_at: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<Session> {
    const { data: session, error } = await supabase
      .from('sessions')
      .insert(data)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    return session;
  },

  async getSessionByToken(token: string): Promise<Session | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select()
      .eq('token', token)
      .single();

    if (error) return null;
    return data;
  },

  async deleteSession(id: string): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);

    if (error) throw new DatabaseError(error.message, error.code);
  },

  async deleteAllUserSessions(userId: string): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('user_id', userId);

    if (error) throw new DatabaseError(error.message, error.code);
  },

  async cleanupExpiredSessions(): Promise<void> {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) throw new DatabaseError(error.message, error.code);
  },
};

// ============================================================
// MERCHANT OPERATIONS
// ============================================================

export const merchantService = {
  async createMerchant(userId: string, data: CreateMerchantRequest): Promise<Merchant> {
    const { data: merchant, error } = await supabase
      .from('merchants')
      .insert({
        user_id: userId,
        business_name: data.business_name,
        business_type: data.business_type || null,
        tax_id: data.tax_id || null,
        website_url: data.website_url || null,
        description: data.description || null,
        support_email: data.support_email || null,
        support_phone: data.support_phone || null,
      })
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);

    // Create default settings
    await this.createMerchantSettings(merchant.id);

    return merchant;
  },

  async getMerchantById(id: string): Promise<Merchant | null> {
    const { data, error } = await supabase
      .from('merchants')
      .select()
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  async getMerchantByUserId(userId: string): Promise<Merchant | null> {
    const { data, error } = await supabase
      .from('merchants')
      .select()
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data;
  },

  async getAllMerchants(limit: number = 50, offset: number = 0): Promise<Merchant[]> {
    const { data, error } = await supabase
      .from('merchants')
      .select()
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new DatabaseError(error.message, error.code);
    return data || [];
  },

  async getAllInvoices(limit: number = 50, offset: number = 0): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select()
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new DatabaseError(error.message, error.code);
    return data || [];
  },

  async getAllPayments(limit: number = 50, offset: number = 0): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select()
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new DatabaseError(error.message, error.code);
    return data || [];
  },

  async updateMerchant(id: string, data: Partial<Merchant>): Promise<Merchant> {
    const { data: merchant, error } = await supabase
      .from('merchants')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    return merchant;
  },

  async createMerchantSettings(merchantId: string): Promise<MerchantSettings> {
    const { data: settings, error } = await supabase
      .from('merchant_settings')
      .insert({ merchant_id: merchantId })
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    return settings;
  },

  async getMerchantSettings(merchantId: string): Promise<MerchantSettings | null> {
    const { data, error } = await supabase
      .from('merchant_settings')
      .select()
      .eq('merchant_id', merchantId)
      .single();

    if (error) return null;
    return data;
  },

  async updateMerchantSettings(merchantId: string, data: Partial<MerchantSettings>): Promise<MerchantSettings> {
    const { data: settings, error } = await supabase
      .from('merchant_settings')
      .update(data)
      .eq('merchant_id', merchantId)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    return settings;
  },

  async getDashboardStats(merchantId: string): Promise<DashboardStats> {
    // Get total revenue from paid invoices
    const { data: revenueData } = await supabase
      .from('invoices')
      .select('amount')
      .eq('merchant_id', merchantId)
      .eq('status', 'paid');

    const total_revenue = revenueData?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

    // Get total payments
    const { count: total_payments } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId);

    // Get total customers
    const { count: total_customers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId);

    // Get total invoices
    const { count: total_invoices } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId);

    // Get pending invoices
    const { count: pending_invoices } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .eq('status', 'pending');

    // Get paid invoices
    const { count: paid_invoices } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .eq('status', 'paid');

    // Calculate average order value
    const average_order_value = total_invoices && total_invoices > 0 ? total_revenue / total_invoices : 0;

    // Get this month's revenue
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: monthlyRevenueData } = await supabase
      .from('invoices')
      .select('amount')
      .eq('merchant_id', merchantId)
      .eq('status', 'paid')
      .gte('paid_at', firstDayOfMonth);

    const revenue_this_month = monthlyRevenueData?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

    // Get this month's payments
    const { count: payments_this_month } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .gte('created_at', firstDayOfMonth);

    return {
      total_revenue,
      total_payments: total_payments || 0,
      total_customers: total_customers || 0,
      total_invoices: total_invoices || 0,
      pending_invoices: pending_invoices || 0,
      paid_invoices: paid_invoices || 0,
      average_order_value,
      revenue_this_month,
      payments_this_month: payments_this_month || 0,
    };
  },
};

// ============================================================
// API KEY OPERATIONS
// ============================================================

export const apiKeyService = {
  async createApiKey(data: {
    merchant_id: string;
    key_name: string;
    key_hash: string;
    key_prefix: string;
    permissions?: string[];
    expires_at?: string;
  }): Promise<ApiKey> {
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .insert({
        ...data,
        permissions: data.permissions || ['read', 'write'],
      })
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    return apiKey;
  },

  async getApiKeyById(id: string): Promise<ApiKey | null> {
    const { data, error } = await supabase
      .from('api_keys')
      .select()
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  async getApiKeysByMerchant(merchantId: string): Promise<ApiKey[]> {
    const { data, error } = await supabase
      .from('api_keys')
      .select()
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) throw new DatabaseError(error.message, error.code);
    return data || [];
  },

  async validateApiKey(keyHash: string): Promise<ApiKey | null> {
    const { data, error } = await supabase
      .from('api_keys')
      .select()
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();

    if (error) return null;
    
    // Check if expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null;
    }

    return data;
  },

  async updateApiKeyLastUsed(id: string): Promise<void> {
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', id);
  },

  async deleteApiKey(id: string): Promise<void> {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) throw new DatabaseError(error.message, error.code);
  },
};

// ============================================================
// WALLET OPERATIONS
// ============================================================

export const walletService = {
  async createWallet(data: {
    merchant_id: string;
    currency: string;
    address: string;
    is_default?: boolean;
  }): Promise<Wallet> {
    const { data: wallet, error } = await supabase
      .from('wallets')
      .insert(data)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    return wallet;
  },

  async getWalletsByMerchant(merchantId: string): Promise<Wallet[]> {
    const { data, error } = await supabase
      .from('wallets')
      .select()
      .eq('merchant_id', merchantId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw new DatabaseError(error.message, error.code);
    return data || [];
  },

  async getWalletByCurrency(merchantId: string, currency: string): Promise<Wallet | null> {
    const { data, error } = await supabase
      .from('wallets')
      .select()
      .eq('merchant_id', merchantId)
      .eq('currency', currency)
      .eq('is_active', true)
      .single();

    if (error) return null;
    return data;
  },

  async updateWallet(id: string, data: Partial<Wallet>): Promise<Wallet> {
    const { data: wallet, error } = await supabase
      .from('wallets')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    return wallet;
  },
};

// ============================================================
// CUSTOMER OPERATIONS
// ============================================================

export const customerService = {
  async createCustomer(data: {
    merchant_id: string;
    email?: string;
    phone?: string;
    full_name?: string;
    metadata?: Record<string, any>;
  }): Promise<Customer> {
    const { data: customer, error } = await supabase
      .from('customers')
      .insert(data)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    return customer;
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select()
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  async getCustomersByMerchant(merchantId: string, limit = 50, offset = 0): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select()
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new DatabaseError(error.message, error.code);
    return data || [];
  },

  async getOrCreateCustomer(
    merchantId: string,
    email: string,
    data?: {
      phone?: string;
      full_name?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<Customer> {
    // Try to find existing customer
    const { data: existing } = await supabase
      .from('customers')
      .select()
      .eq('merchant_id', merchantId)
      .eq('email', email)
      .single();

    if (existing) return existing;

    // Create new customer
    return this.createCustomer({
      merchant_id: merchantId,
      email,
      ...data,
    });
  },

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
    const { data: customer, error } = await supabase
      .from('customers')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    return customer;
  },
};

// ============================================================
// INVOICE OPERATIONS
// ============================================================

export const invoiceService = {
  async createInvoice(merchantId: string, data: CreateInvoiceRequest): Promise<Invoice> {
    // Generate invoice number
    const { data: invoiceNumData } = await supabase
      .rpc('generate_invoice_number');
    
    const invoice_number = invoiceNumData || `INV-${Date.now()}`;

    // Create or get customer
    let customer_id = data.customer_id;
    if (data.customer_email && !customer_id) {
      const customer = await customerService.getOrCreateCustomer(
        merchantId,
        data.customer_email
      );
      customer_id = customer.id;
    }

    // Calculate expiration
    const expires_in = data.expires_in || 30; // 30 minutes default
    const expires_at = new Date(Date.now() + expires_in * 60 * 1000).toISOString();

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        merchant_id: merchantId,
        customer_id,
        invoice_number,
        description: data.description || null,
        amount: data.amount,
        currency: data.currency || 'USD',
        expires_at,
        metadata: data.metadata || null,
      })
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);

    // Create invoice items if provided
    if (data.items && data.items.length > 0) {
      for (const item of data.items) {
        await supabase.from('invoice_items').insert({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price,
        });
      }
    }

    return invoice;
  },

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select()
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select()
      .eq('invoice_number', invoiceNumber)
      .single();

    if (error) return null;
    return data;
  },

  async getInvoicesByMerchant(
    merchantId: string,
    status?: string,
    limit = 50,
    offset = 0
  ): Promise<Invoice[]> {
    let query = supabase
      .from('invoices')
      .select()
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw new DatabaseError(error.message, error.code);
    return data || [];
  },

  async updateInvoice(id: string, data: Partial<Invoice>): Promise<Invoice> {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    return invoice;
  },

  async markInvoiceAsPaid(id: string): Promise<Invoice> {
    return this.updateInvoice(id, {
      status: 'paid',
      paid_at: new Date().toISOString(),
    });
  },

  async markInvoiceAsExpired(id: string): Promise<Invoice> {
    return this.updateInvoice(id, {
      status: 'expired',
    });
  },

  async cancelInvoice(id: string): Promise<Invoice> {
    return this.updateInvoice(id, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    });
  },
};

// ============================================================
// PAYMENT SESSION OPERATIONS
// ============================================================

export const paymentSessionService = {
  async createPaymentSession(
    invoiceId: string,
    merchantId: string,
    data: CreatePaymentSessionRequest
  ): Promise<PaymentSession> {
    const session_id = `ses_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Get invoice to determine expiration
    const invoice = await invoiceService.getInvoiceById(invoiceId);
    if (!invoice) throw new DatabaseError('Invoice not found');

    const { data: session, error } = await supabase
      .from('payment_sessions')
      .insert({
        invoice_id: invoiceId,
        session_id,
        merchant_id: merchantId,
        customer_email: data.customer_email || null,
        supported_currencies: data.supported_currencies || ['NXR', 'BNB', 'USDT', 'USDC', 'BTC', 'ETH'],
        expires_at: invoice.expires_at,
      })
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    return session;
  },

  async getPaymentSessionById(id: string): Promise<PaymentSession | null> {
    const { data, error } = await supabase
      .from('payment_sessions')
      .select()
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  async getPaymentSessionBySessionId(sessionId: string): Promise<PaymentSession | null> {
    const { data, error } = await supabase
      .from('payment_sessions')
      .select()
      .eq('session_id', sessionId)
      .single();

    if (error) return null;
    return data;
  },

  async updatePaymentSession(id: string, data: Partial<PaymentSession>): Promise<PaymentSession> {
    const { data: session, error } = await supabase
      .from('payment_sessions')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    return session;
  },

  async completePaymentSession(id: string): Promise<PaymentSession> {
    return this.updatePaymentSession(id, {
      status: 'completed',
      completed_at: new Date().toISOString(),
    });
  },
};

// ============================================================
// PAYMENT OPERATIONS
// ============================================================

export const paymentService = {
  async createPayment(data: {
    invoice_id: string;
    payment_session_id?: string;
    merchant_id: string;
    customer_id?: string;
    to_address: string;
    amount: number;
    currency: string;
    from_address?: string;
  }): Promise<Payment> {
    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        ...data,
        status: 'pending',
        confirmations: 0,
        required_confirmations: 6,
      })
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    return payment;
  },

  async getPaymentById(id: string): Promise<Payment | null> {
    const { data, error } = await supabase
      .from('payments')
      .select()
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  async getPaymentsByMerchant(
    merchantId: string,
    status?: string,
    limit = 50,
    offset = 0
  ): Promise<Payment[]> {
    let query = supabase
      .from('payments')
      .select()
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw new DatabaseError(error.message, error.code);
    return data || [];
  },

  async updatePayment(id: string, data: Partial<Payment>): Promise<Payment> {
    const { data: payment, error } = await supabase
      .from('payments')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    return payment;
  },

  async updatePaymentConfirmations(id: string, confirmations: number): Promise<Payment> {
    const payment = await this.getPaymentById(id);
    if (!payment) throw new DatabaseError('Payment not found');

    const updateData: Partial<Payment> = { confirmations };
    
    if (confirmations >= payment.required_confirmations) {
      updateData.status = 'confirmed';
    }

    return this.updatePayment(id, updateData);
  },

  async confirmPayment(id: string, transactionHash: string): Promise<Payment> {
    return this.updatePayment(id, {
      status: 'confirmed',
      transaction_hash: transactionHash,
    });
  },
};

// ============================================================
// RECEIPT OPERATIONS
// ============================================================

export const receiptService = {
  async createReceipt(data: {
    payment_id: string;
    invoice_id: string;
    amount: number;
    currency: string;
    merchant_name?: string;
    customer_name?: string;
  }): Promise<Receipt> {
    // Generate receipt number
    const { data: receiptNumData } = await supabase
      .rpc('generate_receipt_number');
    
    const receipt_number = receiptNumData || `REC-${Date.now()}`;

    const { data: receipt, error } = await supabase
      .from('receipts')
      .insert({
        ...data,
        receipt_number,
      })
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    return receipt;
  },

  async getReceiptById(id: string): Promise<Receipt | null> {
    const { data, error } = await supabase
      .from('receipts')
      .select()
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  async getReceiptByNumber(receiptNumber: string): Promise<Receipt | null> {
    const { data, error } = await supabase
      .from('receipts')
      .select()
      .eq('receipt_number', receiptNumber)
      .single();

    if (error) return null;
    return data;
  },

  async getReceiptsByPayment(paymentId: string): Promise<Receipt[]> {
    const { data, error } = await supabase
      .from('receipts')
      .select()
      .eq('payment_id', paymentId);

    if (error) throw new DatabaseError(error.message, error.code);
    return data || [];
  },
};

// ============================================================
// EXCHANGE RATE OPERATIONS
// ============================================================

export const exchangeRateService = {
  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate | null> {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select()
      .eq('from_currency', fromCurrency)
      .eq('to_currency', toCurrency)
      .eq('is_active', true)
      .single();

    if (error) return null;
    return data;
  },

  async getAllExchangeRates(): Promise<ExchangeRate[]> {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select()
      .eq('is_active', true)
      .order('from_currency', { ascending: true });

    if (error) throw new DatabaseError(error.message, error.code);
    return data || [];
  },

  async createExchangeRate(data: {
    from_currency: string;
    to_currency: string;
    rate: number;
    source?: string;
  }): Promise<ExchangeRate> {
    const { data: rate, error } = await supabase
      .from('exchange_rates')
      .insert({
        ...data,
        source: data.source || 'manual',
      })
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    return rate;
  },

  async updateExchangeRate(id: string, rate: number): Promise<ExchangeRate> {
    const { data: exchangeRate, error } = await supabase
      .from('exchange_rates')
      .update({ rate })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new DatabaseError(error.message, error.code);
    return exchangeRate;
  },
};

// ============================================================
// LOGGING OPERATIONS
// ============================================================

export const loggingService = {
  async createSystemLog(data: {
    level: 'info' | 'warning' | 'error' | 'debug';
    category?: string;
    message: string;
    metadata?: Record<string, any>;
    user_id?: string;
    merchant_id?: string;
    ip_address?: string;
  }): Promise<SystemLog | null> {
    try {
      const { data: log, error } = await supabase
        .from('system_logs')
        .insert(data)
        .select()
        .single();

      if (error) {
        // Log to console as fallback, don't throw
        console.error(`[Logging Service Fallback] ${data.level.toUpperCase()}: ${data.message}`, {
          category: data.category,
          metadata: data.metadata,
          user_id: data.user_id,
          merchant_id: data.merchant_id,
          ip_address: data.ip_address,
          dbError: error.message
        });
        return null;
      }
      return log;
    } catch (error) {
      // Log to console as fallback, don't throw
      console.error(`[Logging Service Fallback] ${data.level.toUpperCase()}: ${data.message}`, {
        category: data.category,
        metadata: data.metadata,
        user_id: data.user_id,
        merchant_id: data.merchant_id,
        ip_address: data.ip_address,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  },

  async createAuditLog(data: {
    user_id?: string;
    merchant_id?: string;
    action: string;
    entity_type?: string;
    entity_id?: string;
    changes?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
  }): Promise<AuditLog | null> {
    try {
      const { data: log, error } = await supabase
        .from('audit_logs')
        .insert(data)
        .select()
        .single();

      if (error) {
        // Log to console as fallback, don't throw
        console.error(`[Audit Log Fallback] Action: ${data.action}`, {
          user_id: data.user_id,
          merchant_id: data.merchant_id,
          entity_type: data.entity_type,
          entity_id: data.entity_id,
          changes: data.changes,
          ip_address: data.ip_address,
          user_agent: data.user_agent,
          dbError: error.message
        });
        return null;
      }
      return log;
    } catch (error) {
      // Log to console as fallback, don't throw
      console.error(`[Audit Log Fallback] Action: ${data.action}`, {
        user_id: data.user_id,
        merchant_id: data.merchant_id,
        entity_type: data.entity_type,
        entity_id: data.entity_id,
        changes: data.changes,
        ip_address: data.ip_address,
        user_agent: data.user_agent,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  },
};

// ============================================================
// NEWS & ANNOUNCEMENTS
// ============================================================

export const newsService = {
  async getPublishedNews(limit = 10): Promise<News[]> {
    const { data, error } = await supabase
      .from('news')
      .select()
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) throw new DatabaseError(error.message, error.code);
    return data || [];
  },

  async getNewsBySlug(slug: string): Promise<News | null> {
    const { data, error } = await supabase
      .from('news')
      .select()
      .eq('slug', slug)
      .eq('published', true)
      .single();

    if (error) return null;
    return data;
  },

  async getLatestNews(): Promise<News | null> {
    const { data, error } = await supabase
      .from('news')
      .select()
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  },
};

export const announcementService = {
  async getActiveAnnouncements(): Promise<Announcement[]> {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('announcements')
      .select()
      .eq('is_active', true)
      .lte('starts_at', now)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('starts_at', { ascending: false });

    if (error) throw new DatabaseError(error.message, error.code);
    return data || [];
  },
};
