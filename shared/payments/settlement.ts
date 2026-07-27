// Settlement models and interfaces
// This file defines the settlement structure without implementing business logic

import {
  Money,
  SettlementStatus,
  PaymentMethod,
  ValidationResult,
} from './types';

/**
 * Settlement - represents a merchant payout
 */
export interface Settlement {
  id: string;
  merchantId: string;
  
  // Settlement details
  amount: Money;
  status: SettlementStatus;
  
  // Bank account information
  bankAccountId: string;
  bankAccount?: {
    bankName: string;
    last4: string;
    routingNumber: string;
  };
  
  // Settlement period
  periodStart: Date;
  periodEnd: Date;
  
  // Transaction references
  transactionIds: string[];
  transactionCount: number;
  
  // Fee breakdown
  processingFees: Money;
  platformFees: Money;
  netAmount: Money;
  
  // Settlement metadata
  description?: string;
  metadata?: Record<string, any>;
  
  // Error information
  errorMessage?: string;
  errorCode?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  scheduledFor?: Date;
  completedAt?: Date;
  failedAt?: Date;
}

/**
 * Settlement creation parameters
 */
export interface CreateSettlementParams {
  merchantId: string;
  bankAccountId: string;
  periodStart: Date;
  periodEnd: Date;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Settlement update parameters
 */
export interface UpdateSettlementParams {
  bankAccountId?: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Settlement service interface
 */
export interface ISettlementService {
  // Create settlement
  createSettlement(params: CreateSettlementParams): Promise<Settlement>;
  
  // Retrieve settlement
  getSettlement(settlementId: string): Promise<Settlement>;
  
  // Update settlement
  updateSettlement(settlementId: string, params: UpdateSettlementParams): Promise<Settlement>;
  
  // Cancel settlement
  cancelSettlement(settlementId: string): Promise<Settlement>;
  
  // Get settlement status
  getSettlementStatus(settlementId: string): Promise<SettlementStatus>;
  
  // List settlements
  listSettlements(filter: SettlementFilter): Promise<Settlement[]>;
  
  // Validate settlement
  validateSettlement(params: CreateSettlementParams): Promise<ValidationResult>;
  
  // Calculate settlement amount
  calculateSettlementAmount(merchantId: string, periodStart: Date, periodEnd: Date): Promise<Money>;
  
  // Get pending settlements
  getPendingSettlements(merchantId: string): Promise<Settlement[]>;
  
  // Get settlement balance
  getSettlementBalance(merchantId: string): Promise<Money>;
}

/**
 * Settlement filter for listing
 */
export interface SettlementFilter {
  merchantId?: string;
  status?: SettlementStatus;
  scheduledAfter?: Date;
  scheduledBefore?: Date;
  completedAfter?: Date;
  completedBefore?: Date;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  offset?: number;
}

/**
 * Settlement validation rules
 */
export interface SettlementValidationRules {
  minimumAmount: Money;
  requireBankAccount: boolean;
  requireValidPeriod: boolean;
  supportedCurrencies: string[];
  maximumPeriodDays: number;
}

/**
 * Settlement state machine
 */
export const SETTLEMENT_STATE_TRANSITIONS: Record<SettlementStatus, SettlementStatus[]> = {
  [SettlementStatus.PENDING]: [
    SettlementStatus.IN_TRANSIT,
    SettlementStatus.CANCELED,
  ],
  [SettlementStatus.IN_TRANSIT]: [
    SettlementStatus.COMPLETED,
    SettlementStatus.FAILED,
  ],
  [SettlementStatus.COMPLETED]: [],
  [SettlementStatus.FAILED]: [
    SettlementStatus.PENDING, // Retry
  ],
  [SettlementStatus.CANCELED]: [],
};

/**
 * Check if a settlement state transition is valid
 */
export function isValidSettlementTransition(
  from: SettlementStatus,
  to: SettlementStatus
): boolean {
  const validTransitions = SETTLEMENT_STATE_TRANSITIONS[from];
  return validTransitions.includes(to);
}

/**
 * Settlement validation helper
 * Placeholder for future implementation
 */
export function validateSettlementParams(
  params: CreateSettlementParams,
  rules: SettlementValidationRules
): ValidationResult {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Validate amount limits
  // 2. Validate bank account exists
  // 3. Validate settlement period
  // 4. Validate merchant exists
  // 5. Validate period length
  
  return {
    valid: true,
    errors: [],
  };
}

/**
 * Calculate settlement fees
 * Placeholder for future implementation
 */
export function calculateSettlementFees(
  grossAmount: Money,
  merchantId: string
): {
  processingFees: Money;
  platformFees: Money;
  netAmount: Money;
} {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Get merchant fee configuration
  // 2. Calculate processing fees
  // 3. Calculate platform fees
  // 4. Calculate net amount
  // 5. Return fee breakdown
  
  return {
    processingFees: {
      amount: 0,
      currency: grossAmount.currency,
    },
    platformFees: {
      amount: 0,
      currency: grossAmount.currency,
    },
    netAmount: {
      amount: 0,
      currency: grossAmount.currency,
    },
  };
}

/**
 * Get settlement schedule
 */
export interface SettlementSchedule {
  merchantId: string;
  schedule: 'daily' | 'weekly' | 'monthly' | 'manual';
  nextSettlementDate: Date;
  minimumSettlementAmount: Money;
}

/**
 * Get settlement schedule
 */
export function getSettlementSchedule(merchantId: string): SettlementSchedule {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Get merchant settlement configuration
  // 2. Calculate next settlement date
  // 3. Return schedule information
  
  return {
    merchantId,
    schedule: 'daily',
    nextSettlementDate: new Date(),
    minimumSettlementAmount: {
      amount: 0,
      currency: 'USD' as any,
    },
  };
}

/**
 * Check if settlement is ready to process
 */
export function isSettlementReady(settlement: Settlement): boolean {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Check if settlement is pending
  // 2. Check if scheduled date has arrived
  // 3. Check if minimum amount is met
  // 4. Return readiness status
  
  return false;
}

/**
 * Get settlement bank account details
 */
export function getSettlementBankAccount(
  bankAccountId: string
): {
  bankName: string;
  last4: string;
  routingNumber: string;
} | null {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Query bank account details
  // 2. Return account information
  
  return null;
}

/**
 * Generate settlement report
 */
export interface SettlementReport {
  settlementId: string;
  merchantId: string;
  periodStart: Date;
  periodEnd: Date;
  grossAmount: Money;
  fees: {
    processing: Money;
    platform: Money;
    total: Money;
  };
  netAmount: Money;
  transactionCount: number;
  transactions: {
    id: string;
    amount: Money;
    date: Date;
  }[];
}

/**
 * Generate settlement report
 */
export function generateSettlementReport(
  settlementId: string
): SettlementReport {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Get settlement details
  // 2. Get related transactions
  // 3. Calculate fee breakdown
  // 4. Generate report object
  
  return {
    settlementId,
    merchantId: '',
    periodStart: new Date(),
    periodEnd: new Date(),
    grossAmount: {
      amount: 0,
      currency: 'USD' as any,
    },
    fees: {
      processing: {
        amount: 0,
        currency: 'USD' as any,
      },
      platform: {
        amount: 0,
        currency: 'USD' as any,
      },
      total: {
        amount: 0,
        currency: 'USD' as any,
      },
    },
    netAmount: {
      amount: 0,
      currency: 'USD' as any,
    },
    transactionCount: 0,
    transactions: [],
  };
}

/**
 * Payout configuration
 */
export interface PayoutConfiguration {
  id: string;
  merchantId: string;
  schedule: 'daily' | 'weekly' | 'monthly' | 'manual';
  minimumAmount: Money;
  bankAccountId: string;
  delayDays: number;
  weekendProcessing: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Get payout configuration
 */
export function getPayoutConfiguration(merchantId: string): PayoutConfiguration | null {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Query payout configuration
  // 2. Return configuration or null
  
  return null;
}

/**
 * Calculate next payout date
 */
export function calculateNextPayoutDate(
  configuration: PayoutConfiguration
): Date {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Get current date
  // 2. Apply schedule rules
  // 3. Apply delay days
  // 4. Handle weekend processing
  // 5. Return next payout date
  
  return new Date();
}
