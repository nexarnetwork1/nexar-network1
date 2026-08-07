import { describe, expect, it } from "vitest";
import { isValidRedirect, safeRedirect } from "@/lib/auth/redirect";

describe("isValidRedirect", () => {
  it("accepts internal paths", () => {
    expect(isValidRedirect("/")).toBe(true);
    expect(isValidRedirect("/marketplace")).toBe(true);
    expect(isValidRedirect("/customer/orders/abc-123")).toBe(true);
    expect(isValidRedirect("/marketplace?auth=signin&role=customer")).toBe(true);
    expect(isValidRedirect("/products/item#reviews")).toBe(true);
  });

  it("rejects absolute and protocol-relative targets", () => {
    expect(isValidRedirect("https://evil.com")).toBe(false);
    expect(isValidRedirect("//evil.com")).toBe(false);
    expect(isValidRedirect("/https://evil.com")).toBe(false);
    expect(isValidRedirect("javascript:alert(1)")).toBe(false);
  });

  it("rejects backslash-obfuscated targets", () => {
    expect(isValidRedirect("/\\evil.com")).toBe(false);
    expect(isValidRedirect("\\\\evil.com")).toBe(false);
    expect(isValidRedirect("/\\/evil.com")).toBe(false);
  });

  it("rejects encoded and double-encoded targets", () => {
    expect(isValidRedirect("/%2F%2Fevil.com")).toBe(false);
    expect(isValidRedirect("/%252F%252Fevil.com")).toBe(false);
    expect(isValidRedirect("/%5Cevil.com")).toBe(false);
    expect(isValidRedirect("/%68ttps%3A%2F%2Fevil.com")).toBe(false);
  });

  it("rejects malformed, empty and oversized input", () => {
    expect(isValidRedirect("")).toBe(false);
    expect(isValidRedirect("/%")).toBe(false);
    expect(isValidRedirect("/path\nSet-Cookie: x=1")).toBe(false);
    expect(isValidRedirect(`/${"a".repeat(3000)}`)).toBe(false);
  });
});

describe("safeRedirect", () => {
  it("passes through safe paths", () => {
    expect(safeRedirect("/merchant")).toBe("/merchant");
  });

  it("falls back for unsafe or missing paths", () => {
    expect(safeRedirect("//evil.com", "/atlas")).toBe("/atlas");
    expect(safeRedirect(null, "/atlas")).toBe("/atlas");
    expect(safeRedirect(undefined)).toBe("/atlas");
  });
});
