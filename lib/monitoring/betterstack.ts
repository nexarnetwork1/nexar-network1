/**
 * Optional Better Stack uptime heartbeat — pinged from /api/health when configured.
 */

export function isBetterStackConfigured(): boolean {
  return Boolean(process.env.BETTERSTACK_HEARTBEAT_URL);
}

export async function pingBetterStackHeartbeat(): Promise<boolean> {
  const url = process.env.BETTERSTACK_HEARTBEAT_URL;
  if (!url) return false;

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
