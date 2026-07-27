// Payment status lifecycle management
// This file defines the payment status structure without implementing business logic

import {
  PaymentStatus,
  InvoiceStatus,
  SettlementStatus,
} from './types';

/**
 * Payment status transition rules
 */
export interface StatusTransitionRule {
  from: PaymentStatus | InvoiceStatus | SettlementStatus;
  to: PaymentStatus | InvoiceStatus | SettlementStatus;
  requiresAction?: boolean;
  allowedRoles?: string[];
  timeConstraints?: {
    minimumHours?: number;
    maximumHours?: number;
  };
}

/**
 * Payment status lifecycle configuration
 */
export const PAYMENT_STATUS_LIFECYCLE: Record<PaymentStatus, {
  description: string;
  userFacing: boolean;
  terminal: boolean;
  reversible: boolean;
  allowedTransitions: PaymentStatus[];
  typicalDuration?: number; // in minutes
}> = {
  [PaymentStatus.PENDING]: {
    description: 'Payment is being processed',
    userFacing: true,
    terminal: false,
    reversible: false,
    allowedTransitions: [
      PaymentStatus.PROCESSING,
      PaymentStatus.CANCELED,
      PaymentStatus.DECLINED,
    ],
    typicalDuration: 5,
  },
  [PaymentStatus.PROCESSING]: {
    description: 'Payment is being processed by payment provider',
    userFacing: true,
    terminal: false,
    reversible: false,
    allowedTransitions: [
      PaymentStatus.SUCCEEDED,
      PaymentStatus.FAILED,
      PaymentStatus.REQUIRES_ACTION,
      PaymentStatus.REQUIRES_CONFIRMATION,
    ],
    typicalDuration: 30,
  },
  [PaymentStatus.REQUIRES_ACTION]: {
    description: 'Payment requires customer action',
    userFacing: true,
    terminal: false,
    reversible: false,
    allowedTransitions: [
      PaymentStatus.PROCESSING,
      PaymentStatus.CANCELED,
    ],
    typicalDuration: 1440, // 24 hours
  },
  [PaymentStatus.REQUIRES_CONFIRMATION]: {
    description: 'Payment requires merchant confirmation',
    userFacing: false,
    terminal: false,
    reversible: false,
    allowedTransitions: [
      PaymentStatus.PROCESSING,
      PaymentStatus.CANCELED,
    ],
    typicalDuration: 2880, // 48 hours
  },
  [PaymentStatus.REQUIRES_CAPTURE]: {
    description: 'Payment requires capture by merchant',
    userFacing: false,
    terminal: false,
    reversible: false,
    allowedTransitions: [
      PaymentStatus.SUCCEEDED,
      PaymentStatus.CANCELED,
    ],
    typicalDuration: 4320, // 72 hours
  },
  [PaymentStatus.SUCCEEDED]: {
    description: 'Payment completed successfully',
    userFacing: true,
    terminal: true,
    reversible: true,
    allowedTransitions: [
      PaymentStatus.REFUNDED,
      PaymentStatus.PARTIALLY_REFUNDED,
      PaymentStatus.DISPUTED,
      PaymentStatus.CHARGEBACK,
    ],
  },
  [PaymentStatus.COMPLETED]: {
    description: 'Payment is complete',
    userFacing: true,
    terminal: true,
    reversible: true,
    allowedTransitions: [
      PaymentStatus.REFUNDED,
      PaymentStatus.PARTIALLY_REFUNDED,
    ],
  },
  [PaymentStatus.FAILED]: {
    description: 'Payment failed',
    userFacing: true,
    terminal: true,
    reversible: false,
    allowedTransitions: [
      PaymentStatus.PENDING, // Retry
    ],
  },
  [PaymentStatus.CANCELED]: {
    description: 'Payment was canceled',
    userFacing: true,
    terminal: true,
    reversible: false,
    allowedTransitions: [],
  },
  [PaymentStatus.DECLINED]: {
    description: 'Payment was declined by payment provider',
    userFacing: true,
    terminal: true,
    reversible: false,
    allowedTransitions: [
      PaymentStatus.PENDING, // Retry
    ],
  },
  [PaymentStatus.REFUNDED]: {
    description: 'Payment was refunded',
    userFacing: true,
    terminal: true,
    reversible: false,
    allowedTransitions: [
      PaymentStatus.PARTIALLY_REFUNDED,
    ],
  },
  [PaymentStatus.PARTIALLY_REFUNDED]: {
    description: 'Payment was partially refunded',
    userFacing: true,
    terminal: true,
    reversible: true,
    allowedTransitions: [
      PaymentStatus.REFUNDED,
    ],
  },
  [PaymentStatus.DISPUTED]: {
    description: 'Payment is being disputed',
    userFacing: true,
    terminal: false,
    reversible: false,
    allowedTransitions: [
      PaymentStatus.SUCCEEDED, // Won dispute
      PaymentStatus.CHARGEBACK, // Lost dispute
    ],
    typicalDuration:  10080, // 7 days
  },
  [PaymentStatus.CHARGEBACK]: {
    description: 'Payment chargeback was processed',
    userFacing: true,
    terminal: true,
    reversible: false,
    allowedTransitions: [],
  },
};

/**
 * Invoice status lifecycle configuration
 */
export const INVOICE_STATUS_LIFECYCLE: Record<InvoiceStatus, {
  description: string;
  userFacing: boolean;
  terminal: boolean;
  reversible: boolean;
  allowedTransitions: InvoiceStatus[];
}> = {
  [InvoiceStatus.DRAFT]: {
    description: 'Invoice is a draft',
    userFacing: false,
    terminal: false,
    reversible: false,
    allowedTransitions: [
      InvoiceStatus.OPEN,
      InvoiceStatus.VOID,
    ],
  },
  [InvoiceStatus.OPEN]: {
    description: 'Invoice is open for payment',
    userFacing: true,
    terminal: false,
    reversible: false,
    allowedTransitions: [
      InvoiceStatus.PAID,
      InvoiceStatus.VOID,
      InvoiceStatus.UNCOLLECTIBLE,
    ],
  },
  [InvoiceStatus.PAID]: {
    description: 'Invoice has been paid',
    userFacing: true,
    terminal: true,
    reversible: true,
    allowedTransitions: [
      InvoiceStatus.VOID,
    ],
  },
  [InvoiceStatus.VOID]: {
    description: 'Invoice has been voided',
    userFacing: true,
    terminal: true,
    reversible: false,
    allowedTransitions: [],
  },
  [InvoiceStatus.UNCOLLECTIBLE]: {
    description: 'Invoice is uncollectible',
    userFacing: true,
    terminal: true,
    reversible: false,
    allowedTransitions: [
      InvoiceStatus.VOID,
    ],
  },
};

/**
 * Settlement status lifecycle configuration
 */
export const SETTLEMENT_STATUS_LIFECYCLE: Record<SettlementStatus, {
  description: string;
  userFacing: boolean;
  terminal: boolean;
  reversible: boolean;
  allowedTransitions: SettlementStatus[];
}> = {
  [SettlementStatus.PENDING]: {
    description: 'Settlement is pending',
    userFacing: false,
    terminal: false,
    reversible: false,
    allowedTransitions: [
      SettlementStatus.IN_TRANSIT,
      SettlementStatus.CANCELED,
    ],
  },
  [SettlementStatus.IN_TRANSIT]: {
    description: 'Settlement is in transit',
    userFacing: true,
    terminal: false,
    reversible: false,
    allowedTransitions: [
      SettlementStatus.COMPLETED,
      SettlementStatus.FAILED,
    ],
  },
  [SettlementStatus.COMPLETED]: {
    description: 'Settlement completed successfully',
    userFacing: true,
    terminal: true,
    reversible: false,
    allowedTransitions: [],
  },
  [SettlementStatus.FAILED]: {
    description: 'Settlement failed',
    userFacing: true,
    terminal: true,
    reversible: false,
    allowedTransitions: [
      SettlementStatus.PENDING, // Retry
    ],
  },
  [SettlementStatus.CANCELED]: {
    description: 'Settlement was canceled',
    userFacing: true,
    terminal: true,
    reversible: false,
    allowedTransitions: [],
  },
};

/**
 * Check if status transition is valid
 */
export function isValidStatusTransition(
  from: PaymentStatus | InvoiceStatus | SettlementStatus,
  to: PaymentStatus | InvoiceStatus | SettlementStatus
): boolean {
  let lifecycle: any;
  
  if (from in PAYMENT_STATUS_LIFECYCLE) {
    lifecycle = PAYMENT_STATUS_LIFECYCLE[from as PaymentStatus];
  } else if (from in INVOICE_STATUS_LIFECYCLE) {
    lifecycle = INVOICE_STATUS_LIFECYCLE[from as InvoiceStatus];
  } else if (from in SETTLEMENT_STATUS_LIFECYCLE) {
    lifecycle = SETTLEMENT_STATUS_LIFECYCLE[from as SettlementStatus];
  } else {
    return false;
  }
  
  return lifecycle.allowedTransitions.includes(to as any);
}

/**
 * Get status description
 */
export function getStatusDescription(
  status: PaymentStatus | InvoiceStatus | SettlementStatus
): string {
  let lifecycle: any;
  
  if (status in PAYMENT_STATUS_LIFECYCLE) {
    lifecycle = PAYMENT_STATUS_LIFECYCLE[status as PaymentStatus];
  } else if (status in INVOICE_STATUS_LIFECYCLE) {
    lifecycle = INVOICE_STATUS_LIFECYCLE[status as InvoiceStatus];
  } else if (status in SETTLEMENT_STATUS_LIFECYCLE) {
    lifecycle = SETTLEMENT_STATUS_LIFECYCLE[status as SettlementStatus];
  } else {
    return 'Unknown status';
  }
  
  return lifecycle.description;
}

/**
 * Check if status is terminal
 */
export function isTerminalStatus(
  status: PaymentStatus | InvoiceStatus | SettlementStatus
): boolean {
  let lifecycle: any;
  
  if (status in PAYMENT_STATUS_LIFECYCLE) {
    lifecycle = PAYMENT_STATUS_LIFECYCLE[status as PaymentStatus];
  } else if (status in INVOICE_STATUS_LIFECYCLE) {
    lifecycle = INVOICE_STATUS_LIFECYCLE[status as InvoiceStatus];
  } else if (status in SETTLEMENT_STATUS_LIFECYCLE) {
    lifecycle = SETTLEMENT_STATUS_LIFECYCLE[status as SettlementStatus];
  } else {
    return false;
  }
  
  return lifecycle.terminal;
}

/**
 * Check if status is user-facing
 */
export function isUserFacingStatus(
  status: PaymentStatus | InvoiceStatus | SettlementStatus
): boolean {
  let lifecycle: any;
  
  if (status in PAYMENT_STATUS_LIFECYCLE) {
    lifecycle = PAYMENT_STATUS_LIFECYCLE[status as PaymentStatus];
  } else if (status in INVOICE_STATUS_LIFECYCLE) {
    lifecycle = INVOICE_STATUS_LIFECYCLE[status as InvoiceStatus];
  } else if (status in SETTLEMENT_STATUS_LIFECYCLE) {
    lifecycle = SETTLEMENT_STATUS_LIFECYCLE[status as SettlementStatus];
  } else {
    return false;
  }
  
  return lifecycle.userFacing;
}

/**
 * Check if status is reversible
 */
export function isReversibleStatus(
  status: PaymentStatus | InvoiceStatus | SettlementStatus
): boolean {
  let lifecycle: any;
  
  if (status in PAYMENT_STATUS_LIFECYCLE) {
    lifecycle = PAYMENT_STATUS_LIFECYCLE[status as PaymentStatus];
  } else if (status in INVOICE_STATUS_LIFECYCLE) {
    lifecycle = INVOICE_STATUS_LIFECYCLE[status as InvoiceStatus];
  } else if (status in SETTLEMENT_STATUS_LIFECYCLE) {
    lifecycle = SETTLEMENT_STATUS_LIFECYCLE[status as SettlementStatus];
  } else {
    return false;
  }
  
  return lifecycle.reversible;
}

/**
 * Get allowed transitions for status
 */
export function getAllowedTransitions(
  status: PaymentStatus | InvoiceStatus | SettlementStatus
): (PaymentStatus | InvoiceStatus | SettlementStatus)[] {
  let lifecycle: any;
  
  if (status in PAYMENT_STATUS_LIFECYCLE) {
    lifecycle = PAYMENT_STATUS_LIFECYCLE[status as PaymentStatus];
  } else if (status in INVOICE_STATUS_LIFECYCLE) {
    lifecycle = INVOICE_STATUS_LIFECYCLE[status as InvoiceStatus];
  } else if (status in SETTLEMENT_STATUS_LIFECYCLE) {
    lifecycle = SETTLEMENT_STATUS_LIFECYCLE[status as SettlementStatus];
  } else {
    return [];
  }
  
  return lifecycle.allowedTransitions;
}

/**
 * Get typical duration for status
 */
export function getTypicalDuration(
  status: PaymentStatus
): number | undefined {
  const lifecycle = PAYMENT_STATUS_LIFECYCLE[status];
  return lifecycle.typicalDuration;
}

/**
 * Status service interface
 */
export interface IStatusService {
  // Validate status transition
  validateTransition(
    from: PaymentStatus | InvoiceStatus | SettlementStatus,
    to: PaymentStatus | InvoiceStatus | SettlementStatus
  ): Promise<boolean>;
  
  // Get status description
  getDescription(status: PaymentStatus | InvoiceStatus | SettlementStatus): string;
  
  // Check if status is terminal
  isTerminal(status: PaymentStatus | InvoiceStatus | SettlementStatus): boolean;
  
  // Check if status is user-facing
  isUserFacing(status: PaymentStatus | InvoiceStatus | SettlementStatus): boolean;
  
  // Check if status is reversible
  isReversible(status: PaymentStatus | InvoiceStatus | SettlementStatus): boolean;
  
  // Get allowed transitions
  getAllowedTransitions(status: PaymentStatus | InvoiceStatus | SettlementStatus): (PaymentStatus | InvoiceStatus | SettlementStatus)[];
  
  // Get typical duration
  getTypicalDuration(status: PaymentStatus): number | undefined;
  
  // Process status transition
  processTransition(
    entityId: string,
    from: PaymentStatus | InvoiceStatus | SettlementStatus,
    to: PaymentStatus | InvoiceStatus | SettlementStatus
  ): Promise<void>;
}

/**
 * Status event
 */
export interface StatusEvent {
  id: string;
  entityId: string;
  entityType: 'payment' | 'invoice' | 'settlement';
  fromStatus: PaymentStatus | InvoiceStatus | SettlementStatus;
  toStatus: PaymentStatus | InvoiceStatus | SettlementStatus;
  timestamp: Date;
  triggeredBy?: string;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Record status event
 */
export function recordStatusEvent(event: StatusEvent): void {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Log status event
  // 2. Update audit log
  // 3. Trigger webhooks if configured
  // 4. Update notifications
  
  console.log('Status event:', event);
}

/**
 * Get status history
 */
export function getStatusHistory(
  entityId: string,
  entityType: 'payment' | 'invoice' | 'settlement'
): StatusEvent[] {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Query status events
  // 2. Return sorted history
  
  return [];
}

/**
 * Auto-transition status based on time
 */
export function autoTransitionStatus(
  currentStatus: PaymentStatus,
  createdAt: Date
): PaymentStatus | null {
  // Placeholder implementation
  // In future phases, this will:
  // 1. Check typical duration
  // 2. Check if time has elapsed
  // 3. Auto-transition if applicable
  // 4. Return new status or null
  
  return null;
}
