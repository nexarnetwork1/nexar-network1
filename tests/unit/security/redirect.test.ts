import { describe, expect, it } from "vitest";
import {
  buildOAuthCallbackPath,
  isValidRedirect,
  resolveAuthJsRedirectUrl,
  safeRedirect,
} from "@/lib/auth/redirect";

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

describe("resolveAuthJsRedirectUrl", () => {
  const baseUrl = "http://localhost:3000";

  it("preserves relative callback paths with query params", () => {
    expect(resolveAuthJsRedirectUrl("/auth/callback?redirect=%2Fatlas", baseUrl)).toBe(
      "http://localhost:3000/auth/callback?redirect=%2Fatlas",
    );
  });

  it("accepts same-origin absolute callback URLs", () => {
    expect(
      resolveAuthJsRedirectUrl(
        "http://localhost:3000/auth/callback?redirect=%2Fmerchant",
        baseUrl,
      ),
    ).toBe("http://localhost:3000/auth/callback?redirect=%2Fmerchant");
  });

  it("maps 127.0.0.1 callback URLs onto the active localhost host", () => {
    expect(
      resolveAuthJsRedirectUrl(
        "http://127.0.0.1:3000/auth/callback?redirect=%2Fatlas",
        baseUrl,
      ),
    ).toBe("http://localhost:3000/auth/callback?redirect=%2Fatlas");
  });

  it("rejects external origins while preserving internal callback params", () => {
    expect(
      resolveAuthJsRedirectUrl(
        "https://evil.com/auth/callback?redirect=%2Fatlas",
        baseUrl,
      ),
    ).toBe("http://localhost:3000/auth/callback");
  });
});

describe("buildOAuthCallbackPath", () => {
  it("builds a safe relative Auth.js callback path", () => {
    expect(buildOAuthCallbackPath("/merchant")).toBe(
      "/auth/callback?redirect=%2Fmerchant",
    );
  });

  it("blocks open redirects in callback destination", () => {
    expect(buildOAuthCallbackPath("//evil.com")).toBe(
      "/auth/callback?redirect=%2Fatlas",
    );
  });
});
