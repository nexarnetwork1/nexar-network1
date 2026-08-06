/**
 * ATLAS Mobile — deep links & universal links (pure).
 */

export type DeepLinkMatch = {
  pathPattern: string;
  targetModule: string;
  params: Record<string, string>;
};

const DEFAULT_PATTERNS: Array<{ pattern: string; module: string }> = [
  { pattern: "/business/:id", module: "business" },
  { pattern: "/marketplace/listings/:id", module: "marketplace" },
  { pattern: "/orders/:id", module: "marketplace" },
  { pattern: "/network/profiles/:id", module: "network" },
  { pattern: "/pulse/:id", module: "feed" },
  { pattern: "/connect/channels/:id", module: "connect" },
  { pattern: "/wallet", module: "wallet" },
  { pattern: "/ai/insights/:id", module: "ai" },
  { pattern: "/finance/invoices/:id", module: "finance" },
  { pattern: "/approvals/:id", module: "connect" },
  { pattern: "/meetings/:id", module: "connect" },
];

function matchPattern(
  pattern: string,
  path: string,
): Record<string, string> | null {
  const pParts = pattern.split("/").filter(Boolean);
  const tParts = path.split("/").filter(Boolean);
  if (pParts.length !== tParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pParts.length; i++) {
    if (pParts[i].startsWith(":")) {
      params[pParts[i].slice(1)] = decodeURIComponent(tParts[i]);
    } else if (pParts[i] !== tParts[i]) {
      return null;
    }
  }
  return params;
}

export function parseDeepLink(
  url: string,
  patterns = DEFAULT_PATTERNS,
): DeepLinkMatch | null {
  let path = url;
  try {
    if (url.startsWith("atlas://")) {
      path = "/" + url.slice("atlas://".length).split("?")[0];
    } else if (url.includes("://")) {
      const u = new URL(url);
      path = u.pathname;
    } else if (!url.startsWith("/")) {
      path = `/${url}`;
    }
  } catch {
    return null;
  }

  for (const p of patterns) {
    const params = matchPattern(p.pattern, path);
    if (params) {
      return {
        pathPattern: p.pattern,
        targetModule: p.module,
        params,
      };
    }
  }
  return null;
}

export function buildUniversalLink(
  path: string,
  host = "https://atlas.nexar.network",
): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${host}${normalized}`;
}
