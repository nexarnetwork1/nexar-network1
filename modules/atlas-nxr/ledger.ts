/**
 * ATLAS NXR — token ledger engine (pure).
 * Off-chain balances; blockchain adapters never required.
 */

export type LedgerMove = {
  fromBalance: number;
  toBalance: number;
  amount: number;
};

export type LedgerMoveResult =
  | { ok: true; fromNext: number; toNext: number }
  | { ok: false; error: string };

export function applyTransfer(move: LedgerMove): LedgerMoveResult {
  if (move.amount <= 0) return { ok: false, error: "Amount must be positive" };
  if (move.fromBalance < move.amount) {
    return { ok: false, error: "Insufficient NXR balance" };
  }
  return {
    ok: true,
    fromNext: round8(move.fromBalance - move.amount),
    toNext: round8(move.toBalance + move.amount),
  };
}

export function applyCredit(
  balance: number,
  amount: number,
): LedgerMoveResult {
  if (amount <= 0) return { ok: false, error: "Amount must be positive" };
  return { ok: true, fromNext: balance, toNext: round8(balance + amount) };
}

export function applyDebit(
  balance: number,
  amount: number,
): LedgerMoveResult {
  if (amount <= 0) return { ok: false, error: "Amount must be positive" };
  if (balance < amount) return { ok: false, error: "Insufficient NXR balance" };
  return { ok: true, fromNext: round8(balance - amount), toNext: balance };
}

export function convertNxrToFiat(
  nxrAmount: number,
  rate: number,
): number {
  return round8(nxrAmount * (rate > 0 ? rate : 0));
}

export function convertFiatToNxr(
  fiatAmount: number,
  rate: number,
): number {
  if (rate <= 0) return 0;
  return round8(fiatAmount / rate);
}

export function checkRateLimit(input: {
  count: number;
  amountTotal: number;
  maxCount: number;
  maxAmount: number;
  nextAmount: number;
}): { allowed: boolean; reason?: string } {
  if (input.count + 1 > input.maxCount) {
    return { allowed: false, reason: "Transfer count rate limit exceeded" };
  }
  if (input.amountTotal + input.nextAmount > input.maxAmount) {
    return { allowed: false, reason: "Transfer amount rate limit exceeded" };
  }
  return { allowed: true };
}

function round8(n: number): number {
  return Math.round(n * 1e8) / 1e8;
}

export { round8 };
