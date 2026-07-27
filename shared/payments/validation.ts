// Security validation architecture
// This file defines validation hooks and rules without implementing actual security logic

import { PaymentStatus, PaymentFlow, Currency } from './types';
import { BlockchainNetwork } from './network';
import { isValidUUID, isValidUUIDSafe } from '../utils/uuid';
import { isValidInvoiceNumber } from '../utils/invoice';

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Session validation rules
 */
export interface SessionValidationRules {
  requireValidUUID: boolean;
  requireExpiryCheck: boolean;
  requireActiveStatus: boolean;
  requireMerchantVerification: boolean;
  requireAmountLimits: boolean;
  minAmount?: number;
  maxAmount?: number;
  allowedCurrencies?: Currency[];
  allowedNetworks?: BlockchainNetwork[];
}

/**
 * Payment intent validation rules
 */
export interface PaymentIntentValidationRules {
  requireValidFlow: boolean;
  requireValidPaymentMethods: boolean;
  requireReturnUrl: boolean;
  requireCancelUrl: boolean;
  allowedFlows?: PaymentFlow[];
}

/**
 * Webhook validation rules
 */
export interface WebhookValidationRules {
  requireSignature: boolean;
  requireTimestamp: boolean;
  maxTimestampAge?: number; // in seconds
  allowedEvents?: string[];
}

/**
 * Validate payment session
 */
export function validatePaymentSession(
  session: unknown,
  rules: SessionValidationRules
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Type guard
  if (!session || typeof session !== 'object') {
    errors.push('Invalid session object');
    return { valid: false, errors, warnings };
  }

  const sessionObj = session as Record<string, unknown>;

  // UUID validation
  if (rules.requireValidUUID) {
    if (!sessionObj.id || typeof sessionObj.id !== 'string' || !isValidUUID(sessionObj.id)) {
      errors.push('Invalid session ID format');
    }
    if (!sessionObj.sessionId || typeof sessionObj.sessionId !== 'string' || !isValidUUID(sessionObj.sessionId)) {
      errors.push('Invalid session ID format');
    }
  }

  // Expiry check
  if (rules.requireExpiryCheck) {
    if (!sessionObj.expiresAt) {
      errors.push('Session expiry is required');
    } else if (new Date(sessionObj.expiresAt as string) < new Date()) {
      errors.push('Session has expired');
    }
  }

  // Status check
  if (rules.requireActiveStatus) {
    if (sessionObj.status !== 'active') {
      errors.push('Session is not active');
    }
  }

  // Merchant verification
  if (rules.requireMerchantVerification) {
    if (sessionObj.isVerifiedMerchant !== true) {
      warnings.push('Merchant is not verified');
    }
  }

  // Amount limits
  if (rules.requireAmountLimits) {
    const amount = sessionObj.amount as Record<string, unknown> | undefined;
    if (amount && typeof amount.amount === 'number') {
      if (rules.minAmount && amount.amount < rules.minAmount) {
        errors.push(`Amount below minimum ${rules.minAmount}`);
      }
      if (rules.maxAmount && amount.amount > rules.maxAmount) {
        errors.push(`Amount exceeds maximum ${rules.maxAmount}`);
      }
    }
  }

  // Currency validation
  if (rules.allowedCurrencies && sessionObj.currency) {
    if (!rules.allowedCurrencies.includes(sessionObj.currency as Currency)) {
      errors.push('Currency not allowed');
    }
  }

  // Network validation
  if (rules.allowedNetworks && sessionObj.network) {
    if (!rules.allowedNetworks.includes(sessionObj.network as BlockchainNetwork)) {
      errors.push('Network not allowed');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate payment intent
 */
export function validatePaymentIntent(
  intent: unknown,
  rules: PaymentIntentValidationRules
): ValidationResult {
  const errors: string[] = [];

  // Type guard
  if (!intent || typeof intent !== 'object') {
    errors.push('Invalid intent object');
    return { valid: false, errors };
  }

  const intentObj = intent as Record<string, unknown>;

  // Flow validation
  if (rules.requireValidFlow) {
    if (!intentObj.flow || !Object.values(PaymentFlow).includes(intentObj.flow as PaymentFlow)) {
      errors.push('Invalid payment flow');
    }
    if (rules.allowedFlows && !rules.allowedFlows.includes(intentObj.flow as PaymentFlow)) {
      errors.push('Payment flow not allowed');
    }
  }

  // Payment methods validation
  if (rules.requireValidPaymentMethods) {
    const paymentMethods = intentObj.paymentMethodTypes as unknown[] | undefined;
    if (!paymentMethods || paymentMethods.length === 0) {
      errors.push('Payment methods are required');
    }
  }

  // URL validation
  if (rules.requireReturnUrl && !intentObj.returnUrl) {
    errors.push('Return URL is required');
  }
  if (rules.requireCancelUrl && !intentObj.cancelUrl) {
    errors.push('Cancel URL is required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate webhook signature
 */
export function validateWebhookSignature(
  payload: unknown,
  signature: string,
  secret: string,
  rules: WebhookValidationRules
): ValidationResult {
  const errors: string[] = [];

  // Type guard
  if (!payload || typeof payload !== 'object') {
    errors.push('Invalid payload object');
    return { valid: false, errors };
  }

  const payloadObj = payload as Record<string, unknown>;

  // Signature validation
  if (rules.requireSignature) {
    if (!signature) {
      errors.push('Webhook signature is required');
    }
    // In production, implement HMAC signature verification
    // const expectedSignature = generateHMAC(payload, secret);
    // if (signature !== expectedSignature) {
    //   errors.push('Invalid webhook signature');
    // }
  }

  // Timestamp validation
  if (rules.requireTimestamp && payloadObj.timestamp) {
    const timestampAge = Math.floor(Date.now() / 1000) - (payloadObj.timestamp as number);
    if (rules.maxTimestampAge && timestampAge > rules.maxTimestampAge) {
      errors.push('Webhook timestamp too old');
    }
  }

  // Event validation
  if (rules.allowedEvents && payloadObj.event) {
    if (!rules.allowedEvents.includes(payloadObj.event as string)) {
      errors.push('Event type not allowed');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate invoice number
 */
export function validateInvoiceNumber(invoiceNumber: string): ValidationResult {
  const errors: string[] = [];

  if (!invoiceNumber) {
    errors.push('Invoice number is required');
  } else if (!isValidInvoiceNumber(invoiceNumber)) {
    errors.push('Invalid invoice number format');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate currency
 */
export function validateCurrency(currency: string): ValidationResult {
  const errors: string[] = [];

  if (!currency) {
    errors.push('Currency is required');
  } else if (!Object.values(Currency).includes(currency as Currency)) {
    errors.push('Invalid currency');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate network
 */
export function validateNetwork(network: string): ValidationResult {
  const errors: string[] = [];

  if (!network) {
    errors.push('Network is required');
  } else if (!Object.values(BlockchainNetwork).includes(network as BlockchainNetwork)) {
    errors.push('Invalid network');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate amount
 */
export function validateAmount(amount: number, min = 0, max = Infinity): ValidationResult {
  const errors: string[] = [];

  if (typeof amount !== 'number' || isNaN(amount)) {
    errors.push('Amount must be a valid number');
  } else if (amount < min) {
    errors.push(`Amount must be at least ${min}`);
  } else if (amount > max) {
    errors.push(`Amount must not exceed ${max}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate wallet address
 */
export function validateWalletAddress(address: string, network: BlockchainNetwork): ValidationResult {
  const errors: string[] = [];

  if (!address) {
    errors.push('Wallet address is required');
  } else {
    // Basic length check
    if (address.length < 10 || address.length > 100) {
      errors.push('Invalid wallet address length');
    }

    // Network-specific validation
    if (isEVMNetwork(network)) {
      if (!address.startsWith('0x') || address.length !== 42) {
        errors.push('Invalid EVM wallet address format');
      }
    }
    // Add more network-specific validations as needed
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if network is EVM-compatible
 */
function isEVMNetwork(network: BlockchainNetwork): boolean {
  const evmNetworks = [
    BlockchainNetwork.ETHEREUM,
    BlockchainNetwork.BNB_SMART_CHAIN,
    BlockchainNetwork.POLYGON,
    BlockchainNetwork.ARBITRUM,
    BlockchainNetwork.OPTIMISM,
    BlockchainNetwork.AVALANCHE,
    BlockchainNetwork.BASE,
  ];
  return evmNetworks.includes(network);
}

/**
 * Default validation rules
 */
export const DEFAULT_SESSION_VALIDATION_RULES: SessionValidationRules = {
  requireValidUUID: true,
  requireExpiryCheck: true,
  requireActiveStatus: true,
  requireMerchantVerification: false,
  requireAmountLimits: true,
  minAmount: 0.01,
  maxAmount: 1000000,
};

export const DEFAULT_PAYMENT_INTENT_VALIDATION_RULES: PaymentIntentValidationRules = {
  requireValidFlow: true,
  requireValidPaymentMethods: true,
  requireReturnUrl: true,
  requireCancelUrl: true,
};

export const DEFAULT_WEBHOOK_VALIDATION_RULES: WebhookValidationRules = {
  requireSignature: true,
  requireTimestamp: true,
  maxTimestampAge: 300, // 5 minutes
};
