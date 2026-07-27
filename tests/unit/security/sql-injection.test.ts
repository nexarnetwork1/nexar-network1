import { describe, expect, it } from "vitest";
import {
  assertSafeInput,
  containsSqlInjectionPattern,
  validateSafeFields,
} from "@/lib/security/sql-injection";

describe("sql-injection", () => {
  it("detects SQL injection patterns", () => {
    expect(containsSqlInjectionPattern("SELECT * FROM users")).toBe(true);
    expect(containsSqlInjectionPattern("'; DROP TABLE users; --")).toBe(true);
    expect(containsSqlInjectionPattern("normal@email.com")).toBe(false);
  });

  it("throws on unsafe input", () => {
    expect(() => assertSafeInput("1 OR 1=1", "email")).toThrow(
      "Potentially unsafe email detected"
    );
  });

  it("validates safe fields", () => {
    const fields = validateSafeFields({ email: "user@example.com", name: "Jane" });
    expect(fields.email).toBe("user@example.com");
  });
});
