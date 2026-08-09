import { describe, expect, it } from "vitest";
import { normalizeWalletAddress } from "@/modules/atlas-auth/wallet-address";
import { mapAuthJsError } from "@/lib/auth/oauth-errors";

describe("normalizeWalletAddress", () => {
  it("accepts valid EVM addresses and lowercases storage form", () => {
    expect(
      normalizeWalletAddress("0x0000000000000000000000000000000000000042"),
    ).toBe("0x0000000000000000000000000000000000000042");
  });

  it("rejects invalid addresses", () => {
    expect(normalizeWalletAddress("not-a-wallet")).toBeNull();
    expect(normalizeWalletAddress("0x123")).toBeNull();
  });
});

describe("mapAuthJsError", () => {
  it("handles OAuth account linking conflict", () => {
    expect(mapAuthJsError("OAuthAccountNotLinked")).toContain("already exists");
  });
});
