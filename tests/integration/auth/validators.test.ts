import { describe, expect, it } from "vitest";
import {
  loginSchema,
  customerRegisterSchema,
  merchantRegisterSchema,
  resetPasswordSchema,
  changeWalletSchema,
} from "@/modules/auth/validators";

describe("auth validators", () => {
  it("validates login credentials", () => {
    const valid = loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });
    expect(valid.success).toBe(true);

    const invalid = loginSchema.safeParse({
      email: "bad",
      password: "short",
    });
    expect(invalid.success).toBe(false);
  });

  it("validates customer registration wallet", () => {
    const result = customerRegisterSchema.safeParse({
      fullName: "Jane Doe",
      email: "jane@example.com",
      password: "password123",
      walletAddress: "0x1234567890123456789012345678901234567890",
    });
    expect(result.success).toBe(true);
  });

  it("validates merchant registration", () => {
    const result = merchantRegisterSchema.safeParse({
      merchantName: "Acme",
      storeName: "Acme Store",
      businessType: "Retail",
      email: "merchant@example.com",
      password: "password123",
      walletAddress: "0x1234567890123456789012345678901234567890",
      mode: "marketplace",
    });
    expect(result.success).toBe(true);
  });

  it("requires matching passwords on reset", () => {
    const result = resetPasswordSchema.safeParse({
      password: "password123",
      confirmPassword: "different",
    });
    expect(result.success).toBe(false);
  });

  it("requires matching wallet addresses", () => {
    const result = changeWalletSchema.safeParse({
      walletAddress: "0x1234567890123456789012345678901234567890",
      confirmWalletAddress: "0x0987654321098765432109876543210987654321",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});
