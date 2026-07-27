import { describe, expect, it } from "vitest";
import {
  checkAccountLockout,
  recordFailedLoginAttempt,
  clearLoginAttempts,
} from "@/lib/security/brute-force";

describe("brute-force", () => {
  const email = "user@example.com";

  it("locks account after max attempts", () => {
    for (let i = 0; i < 4; i += 1) {
      const attempt = recordFailedLoginAttempt(email);
      expect(attempt.locked).toBe(false);
    }
    const locked = recordFailedLoginAttempt(email);
    expect(locked.locked).toBe(true);
    expect(locked.retryAfterMs).toBeGreaterThan(0);
  });

  it("reports lockout status", () => {
    for (let i = 0; i < 5; i += 1) {
      recordFailedLoginAttempt(email);
    }
    const status = checkAccountLockout(email);
    expect(status.locked).toBe(true);
  });

  it("clears attempts after successful login", () => {
    recordFailedLoginAttempt(email);
    clearLoginAttempts(email);
    expect(checkAccountLockout(email).locked).toBe(false);
  });
});
