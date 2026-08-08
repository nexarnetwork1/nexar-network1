import { describe, expect, it } from "vitest";
import {
  checkAccountLockout,
  recordFailedLoginAttempt,
  clearLoginAttempts,
} from "@/lib/security/brute-force";

describe("brute-force", () => {
  const email = "user@example.com";

  it("locks account after max attempts", async () => {
    for (let i = 0; i < 4; i += 1) {
      const attempt = await recordFailedLoginAttempt(email);
      expect(attempt.locked).toBe(false);
    }
    const locked = await recordFailedLoginAttempt(email);
    expect(locked.locked).toBe(true);
    expect(locked.retryAfterMs).toBeGreaterThan(0);
  });

  it("reports lockout status", async () => {
    for (let i = 0; i < 5; i += 1) {
      await recordFailedLoginAttempt(email);
    }
    const status = await checkAccountLockout(email);
    expect(status.locked).toBe(true);
  });

  it("clears attempts after successful login", async () => {
    await recordFailedLoginAttempt(email);
    await clearLoginAttempts(email);
    expect((await checkAccountLockout(email)).locked).toBe(false);
  });
});
