import { describe, expect, it } from "vitest";
import { usdToCrypto } from "@/modules/settlement/fee-calculator";
import { splitSettlementAmounts } from "@/lib/payments/guards";

describe("fee calculator", () => {
  it("converts USD to crypto using rate", () => {
    expect(usdToCrypto(100, 0.5)).toBe(200);
    expect(usdToCrypto(100, 0)).toBe(100);
  });

  it("splits settlement amounts", () => {
    const { platformFee, merchantAmount } = splitSettlementAmounts(100, 0.05);
    expect(platformFee).toBe(5);
    expect(merchantAmount).toBe(95);
  });
});
