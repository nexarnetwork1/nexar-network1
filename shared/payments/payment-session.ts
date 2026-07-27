// Payment Session models and interfaces
// This file defines the checkout session structure without implementing business logic

import {
  Money,
  PaymentMethod,
  PaymentStatus,
  PaymentFlow,
  PaymentMetadata,
  ValidationResult,
} from './types';

/**
 * Payment Session - represents a checkout session
 */
export interface PaymentSession {
  id: string;
  paymentIntentId: string;
  merchantId: string;
  customerId: string;
  
  // Session configuration
  amount: Money;
  currency: string;
  
  // Payment flow
  flow: PaymentFlow;
  
  // Session status
  status: 'active' | 'completed' | 'expired' | 'canceled';
  
  // Session URLs
  url?: string;
  returnUrl?: string;
  cancelUrl?: string;
  
  // Session configuration
  paymentMethodTypes: string[];
  allowedPaymentMethods?: string[];
  
  // Metadata
  metadata?: PaymentMetadata;
  
  // Expiration
  expiresAt: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  canceledAt?: Date;
}

/**
 * Payment Session creation parameters
 */
export interface CreatePaymentSessionParams {
  paymentIntentId: string;
  merchantId: string;
  customerId: string;
  amount: Money;
  flow: PaymentFlow;
  returnUrl?: string;
  cancelUrl?: string;
  paymentMethodTypes?: string[];
  allowedPaymentMethods?: string[];
  metadata?: PaymentMetadata;
  expiresAt?: Date;
}

/**
 * Payment Session update parameters
 */
export interface UpdatePaymentSessionParams {
  amount?: Money;
  returnUrl?: string;
  cancelUrl?: string;
  metadata?: PaymentMetadata;
  expiresAt?: Date;
}

/**
 * Payment Session service interface
 */
export interface IPaymentSessionService {
  // Create payment session
  createSession(params: CreatePaymentSessionParams): Promise<PaymentSession>;
  
  // Retrieve payment session
  getSession(sessionId: string): Promise<PaymentSession>;
  
  // Update payment session
  updateSession(sessionId: string, params: UpdatePaymentSessionParams): Promise<PaymentSession>;
  
  // Expire payment session
  expireSession(sessionId: string): Promise<PaymentSession>;
  
  // Cancel payment session
  cancelSession(sessionId: string): Promise<PaymentSession>;
  
  // Validate payment session
  validateSession(params: CreatePaymentSessionParams): Promise<ValidationResult>;
  
  // Get session status
  getSessionStatus(sessionId: string): Promise<'active' | 'completed' | 'expired' | 'canceled'>;
  
  // List payment sessions
  listSessions(filter: PaymentSessionFilter): Promise<PaymentSession[]>;
  
  // Check if session is expired
  isSessionExpired(session: PaymentSession): boolean;
}

/**
 * Payment Session filter for listing
 */
export interface PaymentSessionFilter {
  merchantId?: string;
  customerId?: string;
  paymentIntentId?: string;
  status?: 'active' | 'completed' | 'expired' | 'canceled';
  createdAfter?: Date;
  createdBefore?: Date;
  expiresAfter?: Date;
  expiresBefore?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Payment Session validation rules
 */
export interface PaymentSessionValidationRules {
  minimumAmount: Money;
  maximumAmount: Money;
  supportedCurrencies: string[];
  allowedFlows: PaymentFlow[];
  sessionTimeout: number; // in minutes
  requireReturnUrl: boolean;
  requireCancelUrl: boolean;
}

/**
 * Payment Session state machine
 */
export const PAYMENT_SESSION_STATE_TRANSITIONS: Record<
  'active' | 'completed' | 'expired' | 'canceled',
  ('active' | 'completed' | 'expired' | 'canceled')[]
> = {
  active: ['completed', 'expired', 'canceled'],
  completed: [],
  expired: [],
  canceled: [],
};

/**
 * Check if a session state transition is valid
 */
export function isValidSessionTransition(
  from: 'active' | 'completed' | 'expired' | 'canceled',
  to: 'active' | 'completed' | 'expired' | 'canceled'
): boolean {
  const validTransitions = PAYMENT_SESSION_STATE_TRANSITIONS[from];
  return validTransitions.includes(to);
}

/**
 * Payment Session validation helper
 * Placeholder for future implementation
 */
export function validatePaymentSessionParams(
  params: CreatePaymentSessionParams,
  rules: PaymentSessionValidationRules
): ValidationResult {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Validate amount limits
  // 2. Validate currency support
  // 3. Validate payment flow
  // 4. Validate URLs
  // 5. Validate expiration time
  // 6. Validate payment method types
  
  return {
    valid: true,
    errors: [],
  };
}

/**
 * Generate payment session URL
 * Placeholder for future implementation
 */
export function generateSessionUrl(
  sessionId: string,
  baseUrl: string
): string {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Generate unique session URL
  // 2. Include session ID
  // 3. Include any necessary parameters
  
  return `${baseUrl}/checkout/${sessionId}`;
}

/**
 * Calculate session expiration time
 */
export function calculateSessionExpiration(
  createdAt: Date,
  timeoutMinutes: number
): Date {
  const expiration = new Date(createdAt);
  expiration.setMinutes(expiration.getMinutes() + timeoutMinutes);
  return expiration;
}

/**
 * Check if session is about to expire
 */
export function isSessionExpiringSoon(
  session: PaymentSession,
  warningMinutes: number = 5
): boolean {
  const now = new Date();
  const warningTime = new Date(session.expiresAt);
  warningTime.setMinutes(warningTime.getMinutes() - warningMinutes);
  return now >= warningTime && now < session.expiresAt;
}

/**
 * Get session time remaining
 */
export function getSessionTimeRemaining(session: PaymentSession): number {
  const now = new Date();
  const expiresAt = session.expiresAt;
  const remaining = expiresAt.getTime() - now.getTime();
  return Math.max(0, remaining);
}

/**
 * Session configuration for different payment flows
 */
export const SESSION_CONFIGURATIONS: Record<PaymentFlow, {
  requiresReturnUrl: boolean;
  requiresCancelUrl: boolean;
  allowedPaymentMethods: string[];
  sessionTimeout: number;
}> = {
  [PaymentFlow.DIRECT]: {
    requiresReturnUrl: false,
    requiresCancelUrl: false,
    allowedPaymentMethods: ['card', 'crypto_wallet'],
    sessionTimeout: 30,
  },
  [PaymentFlow.REDIRECT]: {
    requiresReturnUrl: true,
    requiresCancelUrl: true,
    allowedPaymentMethods: ['card', 'bank_account', 'crypto_wallet'],
    sessionTimeout: 60,
  },
  [PaymentFlow.SILENT]: {
    requiresReturnUrl: false,
    requiresCancelUrl: false,
    allowedPaymentMethods: ['card', 'crypto_wallet'],
    sessionTimeout: 15,
  },
  [PaymentFlow.ASYNC]: {
    requiresReturnUrl: true,
    requiresCancelUrl: true,
    allowedPaymentMethods: ['card', 'bank_account', 'crypto_wallet', 'bank_transfer'],
    sessionTimeout: 120,
  },
};

/**
 * Get session configuration for payment flow
 */
export function getSessionConfiguration(flow: PaymentFlow) {
  return SESSION_CONFIGURATIONS[flow];
}
