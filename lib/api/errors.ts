import { NextResponse } from "next/server";
import { AuthorizationError } from "@/lib/auth/guards";
import { writeSecurityLog } from "@/modules/audit/security";

export type ApiErrorBody = {
  error: string;
  code?: string;
};

export function apiError(
  message: string,
  status: number,
  code?: string
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: message, code }, { status });
}

export function handleApiError(err: unknown, path?: string): NextResponse<ApiErrorBody> {
  if (err instanceof AuthorizationError) {
    if (path) {
      writeSecurityLog({
        eventType: "permission_denied",
        metadata: { path, message: err.message },
      }).catch(() => undefined);
    }
    return apiError(err.message, 403, "FORBIDDEN");
  }

  const message = err instanceof Error ? err.message : "Internal server error";
  return apiError(message, 500, "INTERNAL_ERROR");
}
