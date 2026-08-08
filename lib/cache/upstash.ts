/**
 * Optional Upstash Redis REST client.
 * Falls back gracefully when UPSTASH_REDIS_REST_URL / TOKEN are unset.
 */

type UpstashCommand = [string, ...(string | number)[]];

function configured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
  );
}

async function exec<T>(command: UpstashCommand): Promise<T | null> {
  if (!configured()) return null;

  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) return null;
    const json = (await response.json()) as { result?: T };
    return json.result ?? null;
  } catch {
    return null;
  }
}

export function isUpstashConfigured(): boolean {
  return configured();
}

export async function redisGet(key: string): Promise<string | null> {
  const result = await exec<string>(["GET", key]);
  return result ?? null;
}

export async function redisSet(
  key: string,
  value: string,
  ttlSeconds?: number,
): Promise<boolean> {
  if (ttlSeconds && ttlSeconds > 0) {
    const result = await exec<string>(["SET", key, value, "EX", ttlSeconds]);
    return result === "OK";
  }
  const result = await exec<string>(["SET", key, value]);
  return result === "OK";
}

export async function redisIncr(key: string, ttlSeconds?: number): Promise<number | null> {
  const count = await exec<number>(["INCR", key]);
  if (count === 1 && ttlSeconds && ttlSeconds > 0) {
    await exec<number>(["EXPIRE", key, ttlSeconds]);
  }
  return count;
}

export async function redisDel(key: string): Promise<void> {
  await exec<number>(["DEL", key]);
}
