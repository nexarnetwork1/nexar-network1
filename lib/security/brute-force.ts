type AttemptEntry = {
  count: number;
  resetAt: number;
  lockedUntil?: number;
};

const attempts = new Map<string, AttemptEntry>();

export type BruteForceConfig = {
  maxAttempts: number;
  windowMs: number;
  lockoutMs: number;
};

export const DEFAULT_BRUTE_FORCE_CONFIG: BruteForceConfig = {
  maxAttempts: 5,
  windowMs: 15 * 60_000,
  lockoutMs: 30 * 60_000,
};

export function normalizeIdentifier(identifier: string): string {
  return identifier.trim().toLowerCase();
}

export function checkAccountLockout(
  identifier: string,
  config: BruteForceConfig = DEFAULT_BRUTE_FORCE_CONFIG,
  now = Date.now()
): { locked: boolean; retryAfterMs?: number } {
  const key = normalizeIdentifier(identifier);
  const entry = attempts.get(key);

  if (entry?.lockedUntil && now < entry.lockedUntil) {
    return { locked: true, retryAfterMs: entry.lockedUntil - now };
  }

  if (entry?.lockedUntil && now >= entry.lockedUntil) {
    attempts.delete(key);
  }

  return { locked: false };
}

export function recordFailedLoginAttempt(
  identifier: string,
  config: BruteForceConfig = DEFAULT_BRUTE_FORCE_CONFIG,
  now = Date.now()
): { locked: boolean; attempts: number; retryAfterMs?: number } {
  const key = normalizeIdentifier(identifier);
  const existing = attempts.get(key);

  if (existing?.lockedUntil && now < existing.lockedUntil) {
    return {
      locked: true,
      attempts: existing.count,
      retryAfterMs: existing.lockedUntil - now,
    };
  }

  const entry: AttemptEntry =
    !existing || now > existing.resetAt
      ? { count: 1, resetAt: now + config.windowMs }
      : { ...existing, count: existing.count + 1 };

  if (entry.count >= config.maxAttempts) {
    entry.lockedUntil = now + config.lockoutMs;
    attempts.set(key, entry);
    return {
      locked: true,
      attempts: entry.count,
      retryAfterMs: config.lockoutMs,
    };
  }

  attempts.set(key, entry);
  return { locked: false, attempts: entry.count };
}

export function clearLoginAttempts(identifier: string): void {
  attempts.delete(normalizeIdentifier(identifier));
}

export function resetBruteForceStore(): void {
  attempts.clear();
}
