import { describe, expect, it } from "vitest";
import { isSameOriginRequest, crossOriginForbiddenResponse } from "@/lib/security/origin-check";

function requestWith(headers: Record<string, string>): Request {
  return new Request("https://nexarnetwork.org/api/admin/export/orders", {
    method: "POST",
    headers: { host: "nexarnetwork.org", ...headers },
  });
}

describe("isSameOriginRequest", () => {
  it("accepts a matching origin", () => {
    expect(isSameOriginRequest(requestWith({ origin: "https://nexarnetwork.org" }))).toBe(true);
  });

  it("accepts a matching forwarded host", () => {
    const request = requestWith({
      origin: "https://preview.netlify.app",
      "x-forwarded-host": "preview.netlify.app",
    });
    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("rejects a cross-site origin", () => {
    expect(isSameOriginRequest(requestWith({ origin: "https://evil.com" }))).toBe(false);
  });

  it("rejects a cross-site referer when origin is absent", () => {
    expect(isSameOriginRequest(requestWith({ referer: "https://evil.com/attack" }))).toBe(false);
  });

  it("rejects an unparseable origin", () => {
    expect(isSameOriginRequest(requestWith({ origin: "null" }))).toBe(false);
  });

  it("allows requests with no origin information in non-strict mode", () => {
    expect(isSameOriginRequest(requestWith({}))).toBe(true);
  });

  it("rejects requests with no origin information in strict mode", () => {
    expect(isSameOriginRequest(requestWith({}), { strict: true })).toBe(false);
  });
});

describe("crossOriginForbiddenResponse", () => {
  it("returns 403", async () => {
    const response = crossOriginForbiddenResponse();
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: "Cross-origin request rejected",
    });
  });
});
