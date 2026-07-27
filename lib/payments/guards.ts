export type PaymentValidationResult =
  | { valid: true }
  | { valid: false; reason: string; code: string };

export function isPaymentExpired(expiresAt: string | Date, now = new Date()): boolean {
  const expiry = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  return expiry.getTime() <= now.getTime();
}

export function validatePaymentAmount(
  received: number,
  expected: number,
  tolerance = 0.01
): PaymentValidationResult {
  if (!Number.isFinite(received) || !Number.isFinite(expected)) {
    return { valid: false, reason: "Invalid payment amount", code: "INVALID_AMOUNT" };
  }
  if (expected <= 0) {
    return { valid: false, reason: "Expected amount must be positive", code: "INVALID_AMOUNT" };
  }
  const minAcceptable = expected * (1 - tolerance);
  if (received < minAcceptable) {
    return {
      valid: false,
      reason: `Insufficient payment: received ${received}, expected ${expected}`,
      code: "WRONG_AMOUNT",
    };
  }
  return { valid: true };
}

export function validatePaymentCurrency(
  expected: string,
  received: string
): PaymentValidationResult {
  if (expected.toUpperCase() !== received.toUpperCase()) {
    return {
      valid: false,
      reason: `Currency mismatch: expected ${expected}, received ${received}`,
      code: "WRONG_CURRENCY",
    };
  }
  return { valid: true };
}

export function isDuplicateTransaction(
  existingTxHashes: readonly string[],
  txHash: string
): boolean {
  const normalized = txHash.toLowerCase();
  return existingTxHashes.some((hash) => hash.toLowerCase() === normalized);
}

export function canCompletePaymentSession(params: {
  status: string;
  expiresAt: string | Date;
  txHash?: string | null;
  existingTxHashes?: readonly string[];
  now?: Date;
}): PaymentValidationResult {
  if (params.status === "completed") {
    return { valid: false, reason: "Payment already completed", code: "DUPLICATE_PAYMENT" };
  }
  if (params.status === "failed") {
    return { valid: false, reason: "Payment session failed", code: "PAYMENT_FAILED" };
  }
  if (isPaymentExpired(params.expiresAt, params.now)) {
    return { valid: false, reason: "Payment session expired", code: "EXPIRED_PAYMENT" };
  }
  if (params.txHash && params.existingTxHashes?.length) {
    if (isDuplicateTransaction(params.existingTxHashes, params.txHash)) {
      return { valid: false, reason: "Duplicate transaction hash", code: "DUPLICATE_PAYMENT" };
    }
  }
  return { valid: true };
}

export function splitSettlementAmounts(
  amountUsd: number,
  feeRate: number
): { platformFee: number; merchantAmount: number } {
  const platformFee = Number((amountUsd * feeRate).toFixed(8));
  const merchantAmount = Number((amountUsd - platformFee).toFixed(8));
  return { platformFee, merchantAmount };
}
