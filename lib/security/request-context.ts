export type RequestAuditContext = {
  ipAddress?: string;
  userAgent?: string;
  country?: string;
  browser?: string;
};

const COUNTRY_HEADERS = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "cloudfront-viewer-country",
] as const;

export function getClientIpFromRequest(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function getCountryFromRequest(request: Request): string | undefined {
  for (const header of COUNTRY_HEADERS) {
    const value = request.headers.get(header);
    if (value && value !== "XX") return value.toUpperCase();
  }
  return undefined;
}

export function parseBrowser(userAgent: string | null): string | undefined {
  if (!userAgent) return undefined;
  if (/Edg\//i.test(userAgent)) return "Edge";
  if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) return "Chrome";
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) return "Safari";
  if (/Firefox\//i.test(userAgent)) return "Firefox";
  return "Other";
}

export function getRequestAuditContext(request: Request): RequestAuditContext {
  const userAgent = request.headers.get("user-agent");
  return {
    ipAddress: getClientIpFromRequest(request),
    userAgent: userAgent ?? undefined,
    country: getCountryFromRequest(request),
    browser: parseBrowser(userAgent),
  };
}
