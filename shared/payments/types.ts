// Core payment types and interfaces for Nexar Network payment engine
// This file defines the fundamental types without implementing business logic

/**
 * Currency codes supported by the payment platform
 */
export enum Currency {
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  JPY = 'JPY',
  BNB = 'BNB',
  ETH = 'ETH',
  BTC = 'BTC',
  USDT = 'USDT',
  USDC = 'USDC',
  NXR = 'NXR',
}

/**
 * Payment method types
 */
export enum PaymentMethodType {
  CARD = 'card',
  BANK_ACCOUNT = 'bank_account',
  CRYPTO_WALLET = 'crypto_wallet',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  BANK_TRANSFER = 'bank_transfer',
}

/**
 * Card networks
 */
export enum CardNetwork {
  VISA = 'visa',
  MASTERCARD = 'mastercard',
  AMEX = 'amex',
  DISCOVER = 'discover',
  JCB = 'jcb',
  UNIONPAY = 'unionpay',
}

/**
 * Payment status lifecycle
 */
export enum PaymentStatus {
  // Initial states
  PENDING = 'pending',
  PROCESSING = 'processing',
  
  // Success states
  SUCCEEDED = 'succeeded',
  COMPLETED = 'completed',
  
  // Failure states
  FAILED = 'failed',
  CANCELED = 'canceled',
  DECLINED = 'declined',
  
  // Reversible states
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
  
  // Dispute states
  DISPUTED = 'disputed',
  CHARGEBACK = 'chargeback',
  
  // Special states
  REQUIRES_ACTION = 'requires_action',
  REQUIRES_CONFIRMATION = 'requires_confirmation',
  REQUIRES_CAPTURE = 'requires_capture',
}

/**
 * Invoice status
 */
export enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  VOID = 'void',
  UNCOLLECTIBLE = 'uncollectible',
}

/**
 * Settlement status
 */
export enum SettlementStatus {
  PENDING = 'pending',
  IN_TRANSIT = 'in_transit',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

/**
 * Fee types
 */
export enum FeeType {
  PROCESSING = 'processing',
  PLATFORM = 'platform',
  MERCHANT = 'merchant',
  REFUND = 'refund',
  CHARGEBACK = 'chargeback',
  CURRENCY_CONVERSION = 'currency_conversion',
}

/**
 * Transaction types
 */
export enum TransactionType {
  PAYMENT = 'payment',
  REFUND = 'refund',
  CHARGEBACK = 'chargeback',
  PAYOUT = 'payout',
  ADJUSTMENT = 'adjustment',
  FEE = 'fee',
  CURRENCY_CONVERSION = 'currency_conversion',
}

/**
 * Capture method
 */
export enum CaptureMethod {
  AUTOMATIC = 'automatic',
  MANUAL = 'manual',
}

/**
 * Payment flow type
 */
export enum PaymentFlow {
  DIRECT = 'direct',
  REDIRECT = 'redirect',
  SILENT = 'silent',
  ASYNC = 'async',
}

/**
 * Amount interface with currency
 */
export interface Money {
  amount: number;
  currency: Currency;
}

/**
 * Payment method details
 */
export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  customerId: string;
  
  // Card-specific fields
  card?: {
    brand: CardNetwork;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
    fingerprint: string;
  };
  
  // Bank account fields
  bankAccount?: {
    bankName: string;
    last4: string;
    routingNumber: string;
    country: string;
  };
  
  // Crypto wallet fields
  cryptoWallet?: {
    address: string;
    network: string;
    walletType: string;
  };
  
  // Common fields
  isDefault: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Customer information
 */
export interface Customer {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  paymentMethods: PaymentMethod[];
  defaultPaymentMethod?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Merchant configuration
 */
export interface MerchantConfig {
  id: string;
  userId: string;
  businessName: string;
  businessType: string;
  country: string;
  defaultCurrency: Currency;
  
  // Settlement configuration
  settlementConfig: {
    schedule: 'daily' | 'weekly' | 'monthly' | 'manual';
    minimumAmount: Money;
    bankAccount?: string;
  };
  
  // Fee configuration
  feeConfig: {
    processingFeePercentage: number;
    platformFeePercentage: number;
    minimumFee?: Money;
  };
  
  // Payment method configuration
  paymentMethods: {
    cards: boolean;
    crypto: boolean;
    bankTransfer: boolean;
  };
  
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Address information
 */
export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Shipping information
 */
export interface ShippingInfo {
  name: string;
  address: Address;
  phone?: string;
  trackingNumber?: string;
  carrier?: string;
}

/**
 * Product or service information
 */
export interface Product {
  id: string;
  name: string;
  description?: string;
  images?: string[];
  metadata?: Record<string, any>;
}

/**
 * Line item in invoice or payment
 */
export interface LineItem {
  id: string;
  product?: Product;
  description: string;
  quantity: number;
  unitPrice: Money;
  total: Money;
  metadata?: Record<string, any>;
}

/**
 * Error details
 */
export interface PaymentError {
  code: string;
  message: string;
  type: string;
  declineCode?: string;
  metadata?: Record<string, any>;
}

/**
 * Payment metadata
 */
export interface PaymentMetadata {
  orderId?: string;
  description?: string;
  receiptEmail?: string;
  shipping?: ShippingInfo;
  customerIp?: string;
  userAgent?: string;
  custom?: Record<string, any>;
  supportedCurrencies?: string[];
}

/**
 * Fee calculation result
 */
export interface FeeCalculation {
  processingFee: Money;
  platformFee: Money;
  merchantFee: Money;
  totalFees: Money;
  netAmount: Money;
  breakdown: FeeBreakdown[];
}

/**
 * Individual fee breakdown
 */
export interface FeeBreakdown {
  type: FeeType;
  amount: Money;
  description: string;
  percentage?: number;
}

/**
 * Currency conversion result
 */
export interface CurrencyConversion {
  from: Money;
  to: Money;
  rate: number;
  fee?: Money;
  timestamp: Date;
}

/**
 * Refund details
 */
export interface RefundDetails {
  id: string;
  paymentId: string;
  amount: Money;
  reason: string;
  status: 'pending' | 'succeeded' | 'failed';
  metadata?: Record<string, any>;
  createdAt: Date;
  processedAt?: Date;
}

/**
 * Chargeback details
 */
export interface ChargebackDetails {
  id: string;
  paymentId: string;
  amount: Money;
  reason: string;
  status: 'pending' | 'won' | 'lost';
  evidenceDueDate?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Service configuration
 */
export interface PaymentServiceConfig {
  apiUrl: string;
  apiKey: string;
  webhookSecret?: string;
  timeout: number;
  retryConfig: {
    maxRetries: number;
    retryDelay: number;
  };
}
