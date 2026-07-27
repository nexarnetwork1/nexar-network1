// Transaction models and interfaces
// This file defines the transaction structure without implementing business logic

import {
  Money,
  PaymentMethod,
  TransactionType,
  PaymentMetadata,
  ValidationResult,
} from './types';

/**
 * Transaction - represents a financial transaction
 */
export interface Transaction {
  id: string;
  merchantId: string;
  customerId: string;
  
  // Transaction details
  type: TransactionType;
  amount: Money;
  
  // Related entities
  paymentIntentId?: string;
  invoiceId?: string;
  paymentMethodId?: string;
  paymentMethod?: PaymentMethod;
  
  // Transaction status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';
  
  // Transaction metadata
  description?: string;
  metadata?: PaymentMetadata;
  
  // Refund information
  refundId?: string;
  refundReason?: string;
  
  // Currency conversion
  originalAmount?: Money;
  convertedAmount?: Money;
  exchangeRate?: number;
  
  // Fee information
  fees?: TransactionFee[];
  
  // Error information
  errorMessage?: string;
  errorCode?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  failedAt?: Date;
}

/**
 * Transaction fee breakdown
 */
export interface TransactionFee {
  id: string;
  type: string;
  amount: Money;
  description: string;
  recipient: string;
}

/**
 * Transaction creation parameters
 */
export interface CreateTransactionParams {
  merchantId: string;
  customerId: string;
  type: TransactionType;
  amount: Money;
  paymentIntentId?: string;
  invoiceId?: string;
  paymentMethodId?: string;
  description?: string;
  metadata?: PaymentMetadata;
}

/**
 * Transaction update parameters
 */
export interface UpdateTransactionParams {
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';
  description?: string;
  metadata?: PaymentMetadata;
  errorMessage?: string;
  errorCode?: string;
}

/**
 * Transaction service interface
 */
export interface ITransactionService {
  // Create transaction
  createTransaction(params: CreateTransactionParams): Promise<Transaction>;
  
  // Retrieve transaction
  getTransaction(transactionId: string): Promise<Transaction>;
  
  // Update transaction
  updateTransaction(transactionId: string, params: UpdateTransactionParams): Promise<Transaction>;
  
  // Get transaction status
  getTransactionStatus(transactionId: string): Promise<'pending' | 'processing' | 'completed' | 'failed' | 'canceled'>;
  
  // List transactions
  listTransactions(filter: TransactionFilter): Promise<Transaction[]>;
  
  // Validate transaction
  validateTransaction(params: CreateTransactionParams): Promise<ValidationResult>;
  
  // Get transaction balance
  getTransactionBalance(customerId: string): Promise<Money>;
  
  // Get transaction history
  getTransactionHistory(customerId: string, filter: TransactionFilter): Promise<Transaction[]>;
}

/**
 * Transaction filter for listing
 */
export interface TransactionFilter {
  merchantId?: string;
  customerId?: string;
  type?: TransactionType;
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled';
  paymentIntentId?: string;
  invoiceId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  offset?: number;
}

/**
 * Transaction validation rules
 */
export interface TransactionValidationRules {
  minimumAmount: Money;
  maximumAmount: Money;
  supportedTypes: TransactionType[];
  requireCustomer: boolean;
  requirePaymentMethod: boolean;
  supportedCurrencies: string[];
}

/**
 * Transaction state machine
 */
export const TRANSACTION_STATE_TRANSITIONS: Record<
  'pending' | 'processing' | 'completed' | 'failed' | 'canceled',
  ('pending' | 'processing' | 'completed' | 'failed' | 'canceled')[]
> = {
  pending: ['processing', 'canceled', 'failed'],
  processing: ['completed', 'failed', 'canceled'],
  completed: [],
  failed: ['pending'], // Retry
  canceled: [],
};

/**
 * Check if a transaction state transition is valid
 */
export function isValidTransactionTransition(
  from: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled',
  to: 'pending' | 'processing' | 'completed' | 'failed' | 'canceled'
): boolean {
  const validTransitions = TRANSACTION_STATE_TRANSITIONS[from];
  return validTransitions.includes(to);
}

/**
 * Transaction validation helper
 * Placeholder for future implementation
 */
export function validateTransactionParams(
  params: CreateTransactionParams,
  rules: TransactionValidationRules
): ValidationResult {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Validate amount limits
  // 2. Validate transaction type
  // 3. Validate customer exists
  // 4. Validate payment method
  // 5. Validate currency support
  
  return {
    valid: true,
    errors: [],
  };
}

/**
 * Calculate transaction fees
 * Placeholder for future implementation
 */
export function calculateTransactionFees(
  amount: Money,
  type: TransactionType,
  merchantId: string
): TransactionFee[] {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Get merchant fee configuration
  // 2. Calculate processing fees
  // 3. Calculate platform fees
  // 4. Calculate network fees for crypto
  // 5. Return fee breakdown
  
  return [];
}

/**
 * Get transaction by payment intent
 */
export function getTransactionByPaymentIntent(
  paymentIntentId: string
): Transaction | null {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Query transaction by payment intent ID
  // 2. Return transaction or null
  
  return null;
}

/**
 * Get transaction by invoice
 */
export function getTransactionByInvoice(invoiceId: string): Transaction | null {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Query transaction by invoice ID
  // 2. Return transaction or null
  
  return null;
}

/**
 * Get transaction total for period
 */
export function getTransactionTotalForPeriod(
  merchantId: string,
  startDate: Date,
  endDate: Date,
  type?: TransactionType
): Money {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Query transactions for period
  // 2. Filter by type if specified
  // 3. Sum transaction amounts
  // 4. Return formatted money object
  
  return {
    amount: 0,
    currency: 'USD' as any,
  };
}

/**
 * Get transaction count for period
 */
export function getTransactionCountForPeriod(
  merchantId: string,
  startDate: Date,
  endDate: Date,
  type?: TransactionType
): number {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Query transactions for period
  // 2. Filter by type if specified
  // 3. Count transactions
  // 4. Return count
  
  return 0;
}

/**
 * Get transaction summary statistics
 */
export interface TransactionSummary {
  totalAmount: Money;
  totalCount: number;
  successfulCount: number;
  failedCount: number;
  refundedCount: number;
  averageAmount: Money;
  successRate: number;
}

/**
 * Get transaction summary
 */
export function getTransactionSummary(
  merchantId: string,
  startDate: Date,
  endDate: Date
): TransactionSummary {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Query transactions for period
  // 2. Calculate summary statistics
  // 3. Return summary object
  
  return {
    totalAmount: {
      amount: 0,
      currency: 'USD' as any,
    },
    totalCount: 0,
    successfulCount: 0,
    failedCount: 0,
    refundedCount: 0,
    averageAmount: {
      amount: 0,
      currency: 'USD' as any,
    },
    successRate: 0,
  };
}

/**
 * Transaction reconciliation
 */
export interface TransactionReconciliation {
  matched: Transaction[];
  unmatched: {
    paymentId: string;
    amount: Money;
    date: Date;
  }[];
  discrepancies: {
    transactionId: string;
    expectedAmount: Money;
    actualAmount: Money;
  }[];
}

/**
 * Reconcile transactions
 */
export function reconcileTransactions(
  merchantId: string,
  startDate: Date,
  endDate: Date
): TransactionReconciliation {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Get platform transactions
  // 2. Get payment provider transactions
  // 3. Match transactions
  // 4. Identify discrepancies
  // 5. Return reconciliation result
  
  return {
    matched: [],
    unmatched: [],
    discrepancies: [],
  };
}
