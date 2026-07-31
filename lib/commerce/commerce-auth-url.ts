export type CommerceAuthMode = "signin" | "register";
export type CommerceAuthRole = "customer" | "merchant";

export type CommerceAuthUrlParams = {
  auth: CommerceAuthMode;
  role?: CommerceAuthRole;
  redirect?: string;
  message?: string;
  basePath?: string;
};

const COMMERCE_ROUTE_PREFIXES = ["/marketplace", "/customer", "/merchant"] as const;

/** Returns true when pathname belongs to Nexar Commerce routes. */
export function isCommerceRoute(pathname: string): boolean {
  return COMMERCE_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Picks the commerce base path used to host the auth modal opener. */
export function commerceAuthBasePath(pathname: string): string {
  if (pathname.startsWith("/customer")) return "/marketplace";
  if (pathname.startsWith("/merchant")) return "/marketplace";
  if (pathname.startsWith("/marketplace")) return "/marketplace";
  return "/marketplace";
}

/** Builds a commerce URL that opens the Nexar Commerce auth modal. */
export function commerceAuthHref({
  auth,
  role,
  redirect,
  message,
  basePath = "/marketplace",
}: CommerceAuthUrlParams): string {
  const params = new URLSearchParams();
  params.set("auth", auth);
  if (role) params.set("role", role);
  if (redirect) params.set("redirect", redirect);
  if (message) params.set("message", message);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** Parses commerce auth modal params from search params. */
export function parseCommerceAuthParams(searchParams: URLSearchParams): {
  open: boolean;
  mode: CommerceAuthMode | null;
  role: CommerceAuthRole | null;
  redirect: string | null;
  message: string | null;
} {
  const auth = searchParams.get("auth");
  const mode = auth === "signin" || auth === "register" ? auth : null;
  const roleParam = searchParams.get("role");
  const role =
    roleParam === "customer" || roleParam === "merchant" ? roleParam : null;

  return {
    open: mode !== null,
    mode,
    role,
    redirect: searchParams.get("redirect"),
    message: searchParams.get("message"),
  };
}

