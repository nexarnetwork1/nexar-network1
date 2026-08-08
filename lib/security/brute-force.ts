import { isUpstashConfigured, redisGet, redisSet, redisDel } from "@/lib/cache/upstash";
import { isProduction } from "@/config/env";

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

function redisKey(identifier: string): string {
  return `bf:${normalizeIdentifier(identifier)}`;
}

function parseRedisEntry(raw: string | null): AttemptEntry | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AttemptEntry;
    if (
      typeof parsed.count === "number" &&
      typeof parsed.resetAt === "number"
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

async function readEntry(identifier: string): Promise<AttemptEntry | null> {
  const key = normalizeIdentifier(identifier);

  if (isUpstashConfigured()) {
    const raw = await redisGet(redisKey(key));
    return parseRedisEntry(raw);
  }

  if (isProduction()) {
    return null;
  }

  return attempts.get(key) ?? null;
}

async function writeEntry(
  identifier: string,
  entry: AttemptEntry | null,
  ttlSeconds: number,
): Promise<void> {
  const key = normalizeIdentifier(identifier);

  if (isUpstashConfigured()) {
    if (!entry) {
      await redisDel(redisKey(key));
      return;
    }
    await redisSet(redisKey(key), JSON.stringify(entry), ttlSeconds);
    return;
  }

  if (isProduction()) {
    return;
  }

  if (!entry) {
    attempts.delete(key);
    return;
  }
  attempts.set(key, entry);
}

export function normalizeIdentifier(identifier: string): string {
  return identifier.trim().toLowerCase();
}

export async function checkAccountLockout(
  identifier: string,
  config: BruteForceConfig = DEFAULT_BRUTE_FORCE_CONFIG,
  now = Date.now(),
): Promise<{ locked: boolean; retryAfterMs?: number }> {
  const entry = await readEntry(identifier);

  if (entry?.lockedUntil && now < entry.lockedUntil) {
    return { locked: true, retryAfterMs: entry.lockedUntil - now };
  }

  if (entry?.lockedUntil && now >= entry.lockedUntil) {
    await writeEntry(identifier, null, 0);
  }

  return { locked: false };
}

export async function recordFailedLoginAttempt(
  identifier: string,
  config: BruteForceConfig = DEFAULT_BRUTE_FORCE_CONFIG,
  now = Date.now(),
): Promise<{ locked: boolean; attempts: number; retryAfterMs?: number }> {
  const existing = await readEntry(identifier);

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

  const ttlSeconds = Math.ceil(
    Math.max(config.lockoutMs, config.windowMs) / 1000,
  );

  if (entry.count >= config.maxAttempts) {
    entry.lockedUntil = now + config.lockoutMs;
    await writeEntry(identifier, entry, ttlSeconds);
    return {
      locked: true,
      attempts: entry.count,
      retryAfterMs: config.lockoutMs,
    };
  }

  await writeEntry(identifier, entry, ttlSeconds);
  return { locked: false, attempts: entry.count };
}

export async function clearLoginAttempts(identifier: string): Promise<void> {
  await writeEntry(identifier, null, 0);
}

/** @internal test helper */
export function resetBruteForceStore(): void {
  attempts.clear();
}
