import { describe, expect, it } from "vitest";
import { mapAuthJsError } from "@/lib/auth/oauth-errors";
import { resolvePostLoginRedirect, DEFAULT_POST_LOGIN } from "@/lib/auth/redirect";

describe("mapAuthJsError", () => {
  it("maps known OAuth failures", () => {
    expect(mapAuthJsError("AccessDenied")).toContain("cancelled");
    expect(mapAuthJsError("OAuthCallback")).toContain("Social sign-in");
    expect(mapAuthJsError("Configuration")).toContain("not configured");
  });

  it("returns null for empty input", () => {
    expect(mapAuthJsError(null)).toBeNull();
    expect(mapAuthJsError(undefined)).toBeNull();
  });
});

describe("resolvePostLoginRedirect", () => {
  it("defaults to ATLAS home", () => {
    expect(resolvePostLoginRedirect(null)).toBe(DEFAULT_POST_LOGIN);
    expect(resolvePostLoginRedirect(undefined)).toBe("/atlas");
  });

  it("honors safe requested paths including marketplace when explicit", () => {
    expect(resolvePostLoginRedirect("/atlas/settings")).toBe("/atlas/settings");
    expect(resolvePostLoginRedirect("/marketplace")).toBe("/marketplace");
  });

  it("rejects open redirects", () => {
    expect(resolvePostLoginRedirect("//evil.com")).toBe("/atlas");
  });
});
