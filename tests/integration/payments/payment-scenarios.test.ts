import { describe, expect, it } from "vitest";
import {
  canCompletePaymentSession,
  isDuplicateTransaction,
  isPaymentExpired,
  validatePaymentAmount,
  validatePaymentCurrency,
} from "@/lib/payments/guards";

describe("payment guards", () => {
  const future = new Date(Date.now() + 60_000).toISOString();
  const past = new Date(Date.now() - 60_000).toISOString();

  it("detects expired sessions", () => {
    expect(isPaymentExpired(past)).toBe(true);
    expect(isPaymentExpired(future)).toBe(false);
  });

  it("validates payment amounts with tolerance", () => {
    expect(validatePaymentAmount(99, 100, 0.02).valid).toBe(true);
    expect(validatePaymentAmount(90, 100, 0.01).valid).toBe(false);
  });

  it("validates currency match", () => {
    expect(validatePaymentCurrency("USDT", "usdt").valid).toBe(true);
    expect(validatePaymentCurrency("USDT", "BNB").valid).toBe(false);
  });

  it("detects duplicate transactions", () => {
    expect(isDuplicateTransaction(["0xabc", "0xdef"], "0xABC")).toBe(true);
    expect(isDuplicateTransaction(["0xabc"], "0x123")).toBe(false);
  });

  it("blocks completed or expired sessions", () => {
    expect(
      canCompletePaymentSession({ status: "completed", expiresAt: future }).valid
    ).toBe(false);
    expect(
      canCompletePaymentSession({ status: "waiting", expiresAt: past }).valid
    ).toBe(false);
    expect(
      canCompletePaymentSession({
        status: "waiting",
        expiresAt: future,
        txHash: "0xabc",
        existingTxHashes: ["0xabc"],
      }).valid
    ).toBe(false);
    expect(
      canCompletePaymentSession({ status: "waiting", expiresAt: future }).valid
    ).toBe(true);
  });
});
