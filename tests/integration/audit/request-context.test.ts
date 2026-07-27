import { describe, expect, it } from "vitest";
import {
  getClientIpFromRequest,
  getCountryFromRequest,
  getRequestAuditContext,
  parseBrowser,
} from "@/lib/security/request-context";

describe("request audit context", () => {
  it("extracts client IP from forwarded header", () => {
    const request = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
    });
    expect(getClientIpFromRequest(request)).toBe("203.0.113.1");
  });

  it("extracts country from CDN headers", () => {
    const request = new Request("http://localhost", {
      headers: { "cf-ipcountry": "US" },
    });
    expect(getCountryFromRequest(request)).toBe("US");
  });

  it("parses browser from user agent", () => {
    expect(parseBrowser("Mozilla/5.0 Chrome/120.0")).toBe("Chrome");
    expect(parseBrowser("Mozilla/5.0 Firefox/121.0")).toBe("Firefox");
  });

  it("builds full audit context", () => {
    const request = new Request("http://localhost", {
      headers: {
        "x-forwarded-for": "203.0.113.1",
        "cf-ipcountry": "US",
        "user-agent": "Mozilla/5.0 Chrome/120.0",
      },
    });
    const context = getRequestAuditContext(request);
    expect(context.ipAddress).toBe("203.0.113.1");
    expect(context.country).toBe("US");
    expect(context.browser).toBe("Chrome");
  });
});
