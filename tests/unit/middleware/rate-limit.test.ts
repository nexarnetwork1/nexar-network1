import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";
import { applyRateLimit } from "@/lib/middleware/rate-limit";
import { rateLimit } from "@/lib/security/rate-limit";

function createRequest(
  pathname: string,
  options: { method?: string; headers?: Record<string, string>; ip?: string } = {}
): NextRequest {
  const { method = "GET", headers = {}, ip = "203.0.113.10" } = options;

  return new NextRequest(new URL(`http://localhost${pathname}`), {
    method,
    headers: {
      "x-forwarded-for": ip,
      ...headers,
    },
  });
}

describe("applyRateLimit", () => {
  beforeEach(() => {
    rateLimit(`auth:203.0.113.10`, "auth");
    rateLimit(`auth:203.0.113.11`, "auth");
  });

  it("does not rate limit OAuth callback routes", () => {
    for (let i = 0; i < 10; i += 1) {
      const response = applyRateLimit(createRequest("/auth/callback?code=test", { ip: "203.0.113.11" }));
      expect(response).toBeNull();
    }
  });

  it("does not rate limit GET requests to auth pages", () => {
    for (let i = 0; i < 10; i += 1) {
      const response = applyRateLimit(createRequest("/login", { ip: "203.0.113.11" }));
      expect(response).toBeNull();
    }
  });

  it("does not rate limit RSC requests to auth pages", () => {
    for (let i = 0; i < 10; i += 1) {
      const response = applyRateLimit(
        createRequest("/login", {
          ip: "203.0.113.11",
          headers: { RSC: "1" },
        })
      );
      expect(response).toBeNull();
    }
  });

  it("rate limits repeated POST submissions to auth pages", () => {
    const ip = "203.0.113.12";

    for (let i = 0; i < 5; i += 1) {
      const response = applyRateLimit(
        createRequest("/login", { method: "POST", ip })
      );
      expect(response).toBeNull();
    }

    const blocked = applyRateLimit(createRequest("/login", { method: "POST", ip }));
    expect(blocked?.status).toBe(429);
  });
});
