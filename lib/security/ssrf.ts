const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "metadata.google.internal",
]);

const PRIVATE_IPV4_RANGES = [
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
];

export function isPrivateOrLocalHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host)) return true;
  if (host.endsWith(".local") || host.endsWith(".internal")) return true;
  return PRIVATE_IPV4_RANGES.some((pattern) => pattern.test(host));
}

export function assertSafeExternalUrl(
  rawUrl: string,
  allowedProtocols: readonly string[] = ["https:"]
): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!allowedProtocols.includes(parsed.protocol)) {
    throw new Error(`Protocol ${parsed.protocol} is not allowed`);
  }

  if (isPrivateOrLocalHost(parsed.hostname)) {
    throw new Error("Requests to private or local addresses are not allowed");
  }

  return parsed;
}
