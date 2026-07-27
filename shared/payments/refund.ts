// Refund models and interfaces
// This file defines the refund structure without implementing business logic

import {
  Money,
  PaymentMethod,
  PaymentMetadata,
  ValidationResult,
} from './types';

/**
 * Refund - represents a payment refund
 */
export interface Refund {
  id: string;
  paymentId: string;
  paymentIntentId: string;
  merchantId: string;
  customerId: string;
  
  // Refund details
  amount: Money;
  reason: RefundReason;
  status: RefundStatus;
  
  // Refund method
  refundMethod: RefundMethod;
  paymentMethodId?: string;
  paymentMethod?: PaymentMethod;
  
  // Refund configuration
  partial: boolean;
  originalAmount: Money;
  remainingAmount: Money;
  
  // Refund processing
  processingTime?: number; // in minutes
  receiptNumber?: string;
  
  // Refund metadata
  description?: string;
  metadata?: PaymentMetadata;
  
  // Error information
  errorMessage?: string;
  errorCode?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  canceledAt?: Date;
}

/**
 * Refund reason
 */
export enum RefundReason {
  REQUESTED_BY_CUSTOMER = 'requested_by_customer',
  DUPLICATE = 'duplicate',
  FRAUDULENT = 'fraudulent',
  PRODUCT_UNSATISFACTORY = 'product_unsatisfactory',
  PRODUCT_NOT_RECEIVED = 'product_not_received',
  PRODUCT_DIFFERENT = 'product_different',
  CANCELLATION = 'cancellation',
  OTHER = 'other',
}

/**
 * Refund status
 */
export enum RefundStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled',
}

/**
 * Refund method
 */
export enum RefundMethod {
  ORIGINAL_PAYMENT_METHOD = 'original_payment_method',
  BANK_TRANSFER = 'bank_transfer',
  STORE_CREDIT = 'store_credit',
  CHECK = 'check',
}

/**
 * Refund creation parameters
 */
export interface CreateRefundParams {
  paymentId: string;
  paymentIntentId: string;
  amount: Money;
  reason: RefundReason;
  refundMethod?: RefundMethod;
  paymentMethodId?: string;
  description?: string;
  metadata?: PaymentMetadata;
}

/**
 * Refund update parameters
 */
export interface UpdateRefundParams {
  description?: string;
  metadata?: PaymentMetadata;
}

/**
 * Refund service interface
 */
export interface IRefundService {
  // Create refund
  createRefund(params: CreateRefundParams): Promise<Refund>;
  
  // Retrieve refund
  getRefund(refundId: string): Promise<Refund>;
  
  // Update refund
  updateRefund(refundId: string, params: UpdateRefundParams): Promise<Refund>;
  
  // Cancel refund
  cancelRefund(refundId: string): Promise<Refund>;
  
  // Get refund status
  getRefundStatus(refundId: string): Promise<RefundStatus>;
  
  // List refunds
  listRefunds(filter: RefundFilter): Promise<Refund[]>;
  
  // Validate refund
  validateRefund(params: CreateRefundParams): Promise<ValidationResult>;
  
  // Calculate refund amount
  calculateRefundAmount(paymentId: string, amount?: Money): Money;
  
  // Get refundable amount
  getRefundableAmount(paymentId: string): Money;
  
  // Check if refund is allowed
  isRefundAllowed(paymentId: string): boolean;
}

/**
 * Refund filter for listing
 */
export interface RefundFilter {
  merchantId?: string;
  customerId?: string;
  paymentId?: string;
  paymentIntentId?: string;
  status?: RefundStatus;
  reason?: RefundReason;
  createdAfter?: Date;
  createdBefore?: Date;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  offset?: number;
}

/**
 * Refund validation rules
 */
export interface RefundValidationRules {
  requireReason: boolean;
  allowedReasons: RefundReason[];
  refundWindowDays: number;
  maxRefundPercentage: number;
  requireMerchantApproval: boolean;
  supportedRefundMethods: RefundMethod[];
}

/**
 * Refund state machine
 */
export const REFUND_STATE_TRANSITIONS: Record<RefundStatus, RefundStatus[]> = {
  [RefundStatus.PENDING]: [
    RefundStatus.PROCESSING,
    RefundStatus.CANCELED,
  ],
  [RefundStatus.PROCESSING]: [
    RefundStatus.SUCCEEDED,
    RefundStatus.FAILED,
  ],
  [RefundStatus.SUCCEEDED]: [],
  [RefundStatus.FAILED]: [
    RefundStatus.PENDING, // Retry
  ],
  [RefundStatus.CANCELED]: [],
};

/**
 * Check if a refund state transition is valid
 */
export function isValidRefundTransition(
  from: RefundStatus,
  to: RefundStatus
): boolean {
  const validTransitions = REFUND_STATE_TRANSITIONS[from];
  return validTransitions.includes(to);
}

/**
 * Refund validation helper
 * Placeholder for future implementation
 */
export function validateRefundParams(
  params: CreateRefundParams,
  rules: RefundValidationRules
): ValidationResult {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Validate amount is positive
  // 2. Validate reason is allowed
  // 3. Validate refund window
  // 4. Validate payment is refundable
  // 5. Validate refund method
  
  return {
    valid: true,
    errors: [],
  };
}

/**
 * Calculate refund fees
 * Placeholder for future implementation
 */
export function calculateRefundFees(
  amount: Money,
  merchantId: string
): Money {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Get merchant fee configuration
  // 2. Calculate refund processing fees
  // 3. Return fee amount
  
  return {
    amount: 0,
    currency: amount.currency,
  };
}

/**
 * Get refundable amount
 * Placeholder for future implementation
 */
export function getRefundableAmount(
  paymentId: string
): Money {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Get payment details
  // 2. Calculate already refunded amount
  // 3. Return remaining refundable amount
  
  return {
    amount: 0,
    currency: 'USD' as any,
  };
}

/**
 * Check if refund is within refund window
 */
export function isRefundWithinWindow(
  paymentDate: Date,
  refundWindowDays: number
): boolean {
  const now = new Date();
  const windowExpiry = new Date(paymentDate);
  windowExpiry.setDate(windowExpiry.getDate() + refundWindowDays);
  return now <= windowExpiry;
}

/**
 * Get refund by payment
 */
export function getRefundsByPayment(paymentId: string): Refund[] {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Query refunds by payment ID
  // 2. Return refund array
  
  return [];
}

/**
 * Calculate total refunded amount
 */
export function calculateTotalRefundedAmount(paymentId: string): Money {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Get all refunds for payment
  // 2. Sum refund amounts
  // 3. Return total refunded amount
  
  return {
    amount: 0,
    currency: 'USD' as any,
  };
}

/**
 * Partial refund configuration
 */
export interface PartialRefundConfig {
  allowPartialRefunds: boolean;
  minimumPartialAmount: Money;
  maximumPartialPercentage: number;
  requireLineItemLevel: boolean;
}

/**
 * Get partial refund configuration
 */
export function getPartialRefundConfig(merchantId: string): PartialRefundConfig {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Get merchant configuration
  // 2. Return partial refund rules
  
  return {
    allowPartialRefunds: true,
    minimumPartialAmount: {
      amount: 1.00,
      currency: 'USD' as any,
    },
    maximumPartialPercentage: 100,
    requireLineItemLevel: false,
  };
}

/**
 * Line item refund
 */
export interface LineItemRefund {
  lineItemId: string;
  quantity: number;
  amount: Money;
  reason: RefundReason;
}

/**
 * Create line item refund
 */
export interface CreateLineItemRefundParams {
  paymentId: string;
  lineItemRefunds: LineItemRefund[];
  refundMethod?: RefundMethod;
  description?: string;
  metadata?: PaymentMetadata;
}

/**
 * Validate line item refund
 */
export function validateLineItemRefund(
  params: CreateLineItemRefundParams
): ValidationResult {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Validate line items exist
  // 2. Validate quantities
  // 3. Validate amounts
  // 4. Return validation result
  
  return {
    valid: true,
    errors: [],
  };
}

/**
 * Refund report
 */
export interface RefundReport {
  refundId: string;
  paymentId: string;
  amount: Money;
  reason: RefundReason;
  status: RefundStatus;
  processingTime: number;
  createdAt: Date;
  processedAt?: Date;
}

/**
 * Generate refund report
 */
export function generateRefundReport(refundId: string): RefundReport {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Get refund details
  // 2. Calculate processing time
  // 3. Generate report object
  
  return {
    refundId,
    paymentId: '',
    amount: {
      amount: 0,
      currency: 'USD' as any,
    },
    reason: RefundReason.OTHER,
    status: RefundStatus.PENDING,
    processingTime: 0,
    createdAt: new Date(),
  };
}
