import { isUpstashConfigured, redisIncr } from "@/lib/cache/upstash";
import { isProduction } from "@/config/env";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

const PRESETS: Record<string, RateLimitConfig> = {
  auth: { limit: 5, windowMs: 60_000 },
  bootstrap: { limit: 3, windowMs: 900_000 },
  checkout: { limit: 10, windowMs: 60_000 },
  api: { limit: 100, windowMs: 60_000 },
  assistant: { limit: 30, windowMs: 60_000 },
  search: { limit: 60, windowMs: 60_000 },
  messaging: { limit: 120, windowMs: 60_000 },
};

/** Presets that must use distributed Redis in production — no in-memory fallback. */
const SECURITY_CRITICAL_PRESETS = new Set([
  "auth",
  "bootstrap",
]);

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

function evaluateMemory(
  key: string,
  config: RateLimitConfig,
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.limit - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

function failClosed(config: RateLimitConfig): RateLimitResult {
  return {
    allowed: false,
    remaining: 0,
    resetAt: Date.now() + config.windowMs,
  };
}

/** In-process rate limit — used in tests and non-critical dev fallback. */
export function rateLimit(
  key: string,
  preset: keyof typeof PRESETS = "api",
): RateLimitResult {
  const config = PRESETS[preset];
  return evaluateMemory(`mem:${preset}:${key}`, config);
}

/** Distributed rate limit via Upstash when configured. */
export async function rateLimitAsync(
  key: string,
  preset: keyof typeof PRESETS = "api",
): Promise<RateLimitResult> {
  const config = PRESETS[preset];
  const securityCritical = SECURITY_CRITICAL_PRESETS.has(preset);

  if (!isUpstashConfigured()) {
    if (isProduction() && securityCritical) {
      return failClosed(config);
    }
    return evaluateMemory(`mem:${preset}:${key}`, config);
  }

  const redisKey = `rl:${preset}:${key}`;
  const ttlSeconds = Math.ceil(config.windowMs / 1000);
  const count = await redisIncr(redisKey, ttlSeconds);

  if (count === null) {
    if (isProduction() && securityCritical) {
      return failClosed(config);
    }
    return evaluateMemory(`mem:${preset}:${key}`, config);
  }

  const resetAt = Date.now() + config.windowMs;
  if (count > config.limit) {
    return { allowed: false, remaining: 0, resetAt };
  }

  return {
    allowed: true,
    remaining: Math.max(0, config.limit - count),
    resetAt,
  };
}
