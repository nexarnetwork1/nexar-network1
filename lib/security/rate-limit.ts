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
  checkout: { limit: 10, windowMs: 60_000 },
  api: { limit: 100, windowMs: 60_000 },
};

export function rateLimit(
  key: string,
  preset: keyof typeof PRESETS = "api"
): { allowed: boolean; remaining: number; resetAt: number } {
  const config = PRESETS[preset];
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
  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}
