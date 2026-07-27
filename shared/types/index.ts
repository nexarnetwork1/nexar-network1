// Shared types for payment platform architecture

export interface Customer {
  id: string;
  email: string;
  walletAddress?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentMethod {
  id: string;
  customerId: string;
  type: 'card' | 'bank_account' | 'crypto';
  provider: 'stripe' | 'coinbase' | 'internal';
  providerMethodId?: string;
  isDefault: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface Payment {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentMethodId: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  customerId: string;
  productId: string;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  customerId: string;
  subscriptionId?: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void';
  dueDate: Date;
  paidAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface Merchant {
  id: string;
  name: string;
  email: string;
  businessType: string;
  country: string;
  status: 'pending' | 'active' | 'suspended';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKey {
  id: string;
  merchantId: string;
  name: string;
  keyPrefix: string;
  lastUsed?: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface Webhook {
  id: string;
  merchantId: string;
  url: string;
  events: string[];
  secret: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
