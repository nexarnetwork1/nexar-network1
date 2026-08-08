import { redisGet, redisSet, isUpstashConfigured } from "@/lib/cache/upstash";

const memory = new Map<string, { value: string; expiresAt: number }>();

function memoryGet(key: string): string | null {
  const entry = memory.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memory.delete(key);
    return null;
  }
  return entry.value;
}

function memorySet(key: string, value: string, ttlSeconds: number): void {
  memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

/** Cache JSON with Upstash when configured, otherwise in-process memory (single instance). */
export async function cacheGetJson<T>(key: string): Promise<T | null> {
  const raw = isUpstashConfigured() ? await redisGet(key) : memoryGet(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSetJson(
  key: string,
  value: unknown,
  ttlSeconds: number,
): Promise<void> {
  const raw = JSON.stringify(value);
  if (isUpstashConfigured()) {
    await redisSet(key, raw, ttlSeconds);
  } else {
    memorySet(key, raw, ttlSeconds);
  }
}

export function cacheKey(parts: string[]): string {
  return `nxr:${parts.join(":")}`;
}
