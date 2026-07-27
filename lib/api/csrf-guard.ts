import { validateCsrfToken, CSRF_HEADER } from "@/lib/security/csrf";
import { securityLogger } from "@/lib/logging/security-logger";

export async function assertCsrf(request: Request): Promise<boolean> {
  const headerToken = request.headers.get(CSRF_HEADER);
  const valid = await validateCsrfToken(headerToken);

  if (!valid) {
    securityLogger.log({
      event: "csrf_failed",
      path: new URL(request.url).pathname,
      metadata: { hasHeader: Boolean(headerToken) },
    });
  }

  return valid;
}

export async function csrfForbiddenResponse(): Promise<Response> {
  return Response.json({ error: "Invalid CSRF token" }, { status: 403 });
}
