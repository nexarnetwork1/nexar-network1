// Invoice models and interfaces
// This file defines the invoice structure without implementing business logic

import {
  Money,
  Customer,
  LineItem,
  InvoiceStatus,
  PaymentMethod,
  PaymentMetadata,
  ValidationResult,
} from './types';

/**
 * Invoice - represents a billing invoice
 */
export interface Invoice {
  id: string;
  merchantId: string;
  customerId: string;
  
  // Invoice details
  number: string;
  status: InvoiceStatus;
  
  // Billing information
  amountDue: Money;
  amountPaid: Money;
  amountRemaining: Money;
  
  // Invoice items
  items: LineItem[];
  
  // Invoice period
  periodStart: Date;
  periodEnd: Date;
  
  // Due date
  dueDate: Date;
  
  // Payment information
  paymentIntentId?: string;
  paymentMethodId?: string;
  
  // Metadata
  description?: string;
  metadata?: PaymentMetadata;
  
  // Tax information
  tax?: TaxInfo;
  
  // Discount information
  discount?: DiscountInfo;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  voidedAt?: Date;
}

/**
 * Tax information
 */
export interface TaxInfo {
  amount: Money;
  rate: number;
  description?: string;
  exempt: boolean;
}

/**
 * Discount information
 */
export interface DiscountInfo {
  id: string;
  couponId?: string;
  amount: Money;
  percentage?: number;
  description?: string;
}

/**
 * Invoice creation parameters
 */
export interface CreateInvoiceParams {
  merchantId: string;
  customerId: string;
  items: LineItem[];
  description?: string;
  dueDate?: Date;
  paymentMethodId?: string;
  tax?: TaxInfo;
  discount?: DiscountInfo;
  metadata?: PaymentMetadata;
}

/**
 * Invoice update parameters
 */
export interface UpdateInvoiceParams {
  description?: string;
  dueDate?: Date;
  paymentMethodId?: string;
  metadata?: PaymentMetadata;
}

/**
 * Invoice payment parameters
 */
export interface PayInvoiceParams {
  paymentMethodId: string;
  amount?: Money;
}

/**
 * Invoice service interface
 */
export interface IInvoiceService {
  // Create invoice
  createInvoice(params: CreateInvoiceParams): Promise<Invoice>;
  
  // Retrieve invoice
  getInvoice(invoiceId: string): Promise<Invoice>;
  
  // Update invoice
  updateInvoice(invoiceId: string, params: UpdateInvoiceParams): Promise<Invoice>;
  
  // Pay invoice
  payInvoice(invoiceId: string, params: PayInvoiceParams): Promise<Invoice>;
  
  // Void invoice
  voidInvoice(invoiceId: string): Promise<Invoice>;
  
  // Validate invoice
  validateInvoice(params: CreateInvoiceParams): Promise<ValidationResult>;
  
  // Get invoice status
  getInvoiceStatus(invoiceId: string): Promise<InvoiceStatus>;
  
  // List invoices
  listInvoices(filter: InvoiceFilter): Promise<Invoice[]>;
  
  // Calculate invoice total
  calculateInvoiceTotal(items: LineItem[], tax?: TaxInfo, discount?: DiscountInfo): Money;
  
  // Generate invoice number
  generateInvoiceNumber(merchantId: string): string;
}

/**
 * Invoice filter for listing
 */
export interface InvoiceFilter {
  merchantId?: string;
  customerId?: string;
  status?: InvoiceStatus;
  createdAfter?: Date;
  createdBefore?: Date;
  dueAfter?: Date;
  dueBefore?: Date;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  offset?: number;
}

/**
 * Invoice validation rules
 */
export interface InvoiceValidationRules {
  minimumAmount: Money;
  maximumAmount: Money;
  requireCustomer: boolean;
  requireItems: boolean;
  maxItems: number;
  supportedCurrencies: string[];
}

/**
 * Invoice state machine
 */
export const INVOICE_STATE_TRANSITIONS: Record<InvoiceStatus, InvoiceStatus[]> = {
  [InvoiceStatus.DRAFT]: [
    InvoiceStatus.OPEN,
    InvoiceStatus.VOID,
  ],
  [InvoiceStatus.OPEN]: [
    InvoiceStatus.PAID,
    InvoiceStatus.VOID,
    InvoiceStatus.UNCOLLECTIBLE,
  ],
  [InvoiceStatus.PAID]: [
    InvoiceStatus.VOID,
  ],
  [InvoiceStatus.VOID]: [],
  [InvoiceStatus.UNCOLLECTIBLE]: [
    InvoiceStatus.VOID,
  ],
};

/**
 * Check if an invoice state transition is valid
 */
export function isValidInvoiceTransition(
  from: InvoiceStatus,
  to: InvoiceStatus
): boolean {
  const validTransitions = INVOICE_STATE_TRANSITIONS[from];
  return validTransitions.includes(to);
}

/**
 * Invoice validation helper
 * Placeholder for future implementation
 */
export function validateInvoiceParams(
  params: CreateInvoiceParams,
  rules: InvoiceValidationRules
): ValidationResult {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Validate amount limits
  // 2. Validate customer exists
  // 3. Validate items
  // 4. Validate line item totals
  // 5. Validate tax information
  // 6. Validate discount information
  
  return {
    valid: true,
    errors: [],
  };
}

/**
 * Calculate line item total
 */
export function calculateLineItemTotal(item: LineItem): Money {
  return item.total;
}

/**
 * Calculate subtotal from line items
 */
export function calculateSubtotal(items: LineItem[]): Money {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Sum all line item totals
  // 2. Return formatted money object
  
  return {
    amount: 0,
    currency: 'USD' as any,
  };
}

/**
 * Calculate tax amount
 */
export function calculateTaxAmount(
  subtotal: Money,
  taxRate: number
): Money {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Calculate tax amount
  // 2. Apply tax rate to subtotal
  // 3. Return formatted money object
  
  return {
    amount: 0,
    currency: subtotal.currency,
  };
}

/**
 * Calculate discount amount
 */
export function calculateDiscountAmount(
  subtotal: Money,
  discount: DiscountInfo
): Money {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Calculate discount amount
  // 2. Apply percentage or fixed amount
  // 3. Return formatted money object
  
  return {
    amount: 0,
    currency: subtotal.currency,
  };
}

/**
 * Format invoice number
 */
export function formatInvoiceNumber(invoiceNumber: string): string {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Format invoice number
  // 2. Add prefixes/suffixes
  // 3. Apply merchant formatting rules
  
  return invoiceNumber;
}

/**
 * Generate invoice PDF URL
 */
export function generateInvoicePdfUrl(invoiceId: string, baseUrl: string): string {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Generate PDF URL
  // 2. Include invoice ID
  // 3. Include any necessary parameters
  
  return `${baseUrl}/invoices/${invoiceId}/pdf`;
}

/**
 * Check if invoice is overdue
 */
export function isInvoiceOverdue(invoice: Invoice): boolean {
  const now = new Date();
  return invoice.dueDate < now && invoice.status !== InvoiceStatus.PAID;
}

/**
 * Get invoice days overdue
 */
export function getInvoiceDaysOverdue(invoice: Invoice): number {
  if (!isInvoiceOverdue(invoice)) {
    return 0;
  }
  
  const now = new Date();
  const diffTime = now.getTime() - invoice.dueDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Recurring invoice configuration
 */
export interface RecurringInvoiceConfig {
  interval: 'daily' | 'weekly' | 'monthly' | 'yearly';
  intervalCount: number;
  startDate: Date;
  endDate?: Date;
  billingDay?: number; // For monthly/yearly
}

/**
 * Create recurring invoice
 */
export interface CreateRecurringInvoiceParams extends CreateInvoiceParams {
  recurringConfig: RecurringInvoiceConfig;
}

/**
 * Recurring invoice schedule
 */
export interface RecurringInvoiceSchedule {
  invoiceId: string;
  scheduledDate: Date;
  status: 'pending' | 'generated' | 'skipped';
  generatedInvoiceId?: string;
}
