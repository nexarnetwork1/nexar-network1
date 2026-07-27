import { describe, expect, it } from "vitest";
import { assertSafeExternalUrl, isPrivateOrLocalHost } from "@/lib/security/ssrf";

describe("ssrf", () => {
  it("detects private hosts", () => {
    expect(isPrivateOrLocalHost("127.0.0.1")).toBe(true);
    expect(isPrivateOrLocalHost("10.0.0.1")).toBe(true);
    expect(isPrivateOrLocalHost("api.example.com")).toBe(false);
  });

  it("allows safe external URLs", () => {
    const url = assertSafeExternalUrl("https://hooks.example.com/alert");
    expect(url.hostname).toBe("hooks.example.com");
  });

  it("blocks localhost URLs", () => {
    expect(() => assertSafeExternalUrl("https://127.0.0.1/admin")).toThrow(
      "private or local"
    );
  });

  it("blocks non-https by default", () => {
    expect(() => assertSafeExternalUrl("ftp://example.com")).toThrow("not allowed");
  });
});
