import { AppError } from "./app-error";

export type ApiErrorBody = {
  success: false;
  error: {
    message: string;
    code: string;
    details?: Record<string, unknown>;
  };
};

export function apiErrorResponse(error: AppError): Response {
  const body: ApiErrorBody = {
    success: false,
    error: {
      message: error.message,
      code: error.code,
      ...(error.details ? { details: error.details } : {}),
    },
  };

  return Response.json(body, { status: error.statusCode });
}

export function apiSuccessResponse<T>(
  data: T,
  status = 200
): Response {
  return Response.json({ success: true, data }, { status });
}
