// Payment Intent models and interfaces
// This file defines the payment intent structure without implementing business logic

import {
  Money,
  PaymentMethod,
  PaymentStatus,
  PaymentFlow,
  CaptureMethod,
  PaymentError,
  PaymentMetadata,
  ValidationResult,
} from './types';

/**
 * Payment Intent - represents a payment request and its lifecycle
 */
export interface PaymentIntent {
  id: string;
  merchantId: string;
  customerId: string;
  
  // Amount and currency
  amount: Money;
  
  // Payment method
  paymentMethodId?: string;
  paymentMethod?: PaymentMethod;
  
  // Status and lifecycle
  status: PaymentStatus;
  
  // Capture configuration
  captureMethod: CaptureMethod;
  captureAt?: Date;
  
  // Payment flow
  flow: PaymentFlow;
  
  // Metadata
  description?: string;
  metadata?: PaymentMetadata;
  
  // Error information
  lastPaymentError?: PaymentError;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  capturedAt?: Date;
  canceledAt?: Date;
}

/**
 * Payment Intent creation parameters
 */
export interface CreatePaymentIntentParams {
  merchantId: string;
  customerId: string;
  amount: Money;
  paymentMethodId?: string;
  description?: string;
  captureMethod?: CaptureMethod;
  flow?: PaymentFlow;
  metadata?: PaymentMetadata;
}

/**
 * Payment Intent update parameters
 */
export interface UpdatePaymentIntentParams {
  amount?: Money;
  paymentMethodId?: string;
  description?: string;
  metadata?: PaymentMetadata;
}

/**
 * Payment Intent capture parameters
 */
export interface CapturePaymentIntentParams {
  amountToCapture?: Money;
  metadata?: Record<string, any>;
}

/**
 * Payment Intent refund parameters
 */
export interface RefundPaymentIntentParams {
  amount?: Money;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Payment Intent cancel parameters
 */
export interface CancelPaymentIntentParams {
  cancellationReason?: string;
}

/**
 * Payment Intent service interface
 * This defines the contract for payment intent operations
 */
export interface IPaymentIntentService {
  // Create payment intent
  createIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent>;
  
  // Retrieve payment intent
  getIntent(intentId: string): Promise<PaymentIntent>;
  
  // Update payment intent
  updateIntent(intentId: string, params: UpdatePaymentIntentParams): Promise<PaymentIntent>;
  
  // Capture payment intent
  captureIntent(intentId: string, params?: CapturePaymentIntentParams): Promise<PaymentIntent>;
  
  // Cancel payment intent
  cancelIntent(intentId: string, params?: CancelPaymentIntentParams): Promise<PaymentIntent>;
  
  // Refund payment intent
  refundIntent(intentId: string, params?: RefundPaymentIntentParams): Promise<PaymentIntent>;
  
  // Validate payment intent
  validateIntent(params: CreatePaymentIntentParams): Promise<ValidationResult>;
  
  // Get payment intent status
  getIntentStatus(intentId: string): Promise<PaymentStatus>;
  
  // List payment intents
  listIntents(filter: PaymentIntentFilter): Promise<PaymentIntent[]>;
}

/**
 * Payment Intent filter for listing
 */
export interface PaymentIntentFilter {
  merchantId?: string;
  customerId?: string;
  status?: PaymentStatus;
  createdAfter?: Date;
  createdBefore?: Date;
  amountGreaterThan?: number;
  amountLessThan?: number;
  limit?: number;
  offset?: number;
}

/**
 * Payment Intent validation rules
 */
export interface PaymentIntentValidationRules {
  minimumAmount: Money;
  maximumAmount: Money;
  supportedCurrencies: string[];
  allowedPaymentMethods: string[];
  requireCustomer: boolean;
  requirePaymentMethod: boolean;
}

/**
 * Payment Intent state machine
 * This defines the valid state transitions for payment intents
 */
export const PAYMENT_INTENT_STATE_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [
    PaymentStatus.PROCESSING,
    PaymentStatus.CANCELED,
    PaymentStatus.REQUIRES_ACTION,
  ],
  [PaymentStatus.PROCESSING]: [
    PaymentStatus.SUCCEEDED,
    PaymentStatus.FAILED,
    PaymentStatus.REQUIRES_CONFIRMATION,
  ],
  [PaymentStatus.REQUIRES_ACTION]: [
    PaymentStatus.PROCESSING,
    PaymentStatus.CANCELED,
  ],
  [PaymentStatus.REQUIRES_CONFIRMATION]: [
    PaymentStatus.PROCESSING,
    PaymentStatus.CANCELED,
  ],
  [PaymentStatus.REQUIRES_CAPTURE]: [
    PaymentStatus.SUCCEEDED,
    PaymentStatus.CANCELED,
  ],
  [PaymentStatus.SUCCEEDED]: [
    PaymentStatus.REFUNDED,
    PaymentStatus.PARTIALLY_REFUNDED,
    PaymentStatus.DISPUTED,
    PaymentStatus.CHARGEBACK,
  ],
  [PaymentStatus.COMPLETED]: [
    PaymentStatus.REFUNDED,
    PaymentStatus.PARTIALLY_REFUNDED,
  ],
  [PaymentStatus.FAILED]: [
    PaymentStatus.PENDING, // Retry
  ],
  [PaymentStatus.CANCELED]: [],
  [PaymentStatus.DECLINED]: [
    PaymentStatus.PENDING, // Retry
  ],
  [PaymentStatus.REFUNDED]: [],
  [PaymentStatus.PARTIALLY_REFUNDED]: [
    PaymentStatus.REFUNDED,
  ],
  [PaymentStatus.DISPUTED]: [
    PaymentStatus.SUCCEEDED, // Won dispute
    PaymentStatus.CHARGEBACK, // Lost dispute
  ],
  [PaymentStatus.CHARGEBACK]: [],
};

/**
 * Check if a state transition is valid
 */
export function isValidStateTransition(
  from: PaymentStatus,
  to: PaymentStatus
): boolean {
  const validTransitions = PAYMENT_INTENT_STATE_TRANSITIONS[from];
  return validTransitions.includes(to);
}

/**
 * Payment Intent validation helper
 * Placeholder for future implementation
 */
export function validatePaymentIntentParams(
  params: CreatePaymentIntentParams,
  rules: PaymentIntentValidationRules
): ValidationResult {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Validate amount limits
  // 2. Validate currency support
  // 3. Validate payment method
  // 4. Validate customer exists
  // 5. Validate merchant exists
  
  return {
    valid: true,
    errors: [],
  };
}

/**
 * Calculate payment intent fees
 * Placeholder for future implementation
 */
export function calculatePaymentIntentFees(
  amount: Money,
  merchantId: string
): Money {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Get merchant fee configuration
  // 2. Calculate processing fees
  // 3. Calculate platform fees
  // 4. Return total fees
  
  return {
    amount: 0,
    currency: amount.currency,
  };
}

/**
 * Get next expected state for payment intent
 */
export function getNextExpectedState(
  currentStatus: PaymentStatus
): PaymentStatus | null {
  const transitions = PAYMENT_INTENT_STATE_TRANSITIONS[currentStatus];
  return transitions.length > 0 ? transitions[0] : null;
}
