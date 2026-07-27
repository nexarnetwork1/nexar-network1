import { beforeEach, describe, expect, it } from "vitest";
import { rateLimit } from "@/lib/security/rate-limit";

describe("rateLimit", () => {
  beforeEach(() => {
    const uniqueKey = `test-${Date.now()}-${Math.random()}`;
    rateLimit(uniqueKey, "auth");
  });

  it("allows requests within limit", () => {
    const key = `auth-ok-${Date.now()}`;
    const first = rateLimit(key, "auth");
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBeGreaterThanOrEqual(0);
  });

  it("blocks requests over auth limit", () => {
    const key = `auth-block-${Date.now()}`;
    for (let i = 0; i < 5; i += 1) {
      rateLimit(key, "auth");
    }
    const blocked = rateLimit(key, "auth");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});
