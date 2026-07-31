export type AuthModalMode = "signin" | "register";
export type AuthModalRole = "customer" | "merchant";

type AuthModalUrlParams = {
  auth: AuthModalMode;
  role?: AuthModalRole;
  redirect?: string;
  message?: string;
  basePath?: string;
};

/** Builds a marketplace URL that opens the unified auth modal. */
export function authModalHref({
  auth,
  role,
  redirect,
  message,
  basePath = "/marketplace",
}: AuthModalUrlParams): string {
  const params = new URLSearchParams();
  params.set("auth", auth);
  if (role) params.set("role", role);
  if (redirect) params.set("redirect", redirect);
  if (message) params.set("message", message);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}

/** Parses auth modal params from search params. */
export function parseAuthModalParams(searchParams: URLSearchParams): {
  open: boolean;
  mode: AuthModalMode | null;
  role: AuthModalRole | null;
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
