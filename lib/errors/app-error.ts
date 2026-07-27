export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "BAD_REQUEST"
  | "PAYMENT_FAILED"
  | "EXTERNAL_SERVICE_ERROR";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly statusCode: number;
  readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode = "INTERNAL_ERROR",
    statusCode = 500,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }

  static validation(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(message, "VALIDATION_ERROR", 422, details);
  }

  static unauthorized(message = "Unauthorized"): AppError {
    return new AppError(message, "UNAUTHORIZED", 401);
  }

  static forbidden(message = "Forbidden"): AppError {
    return new AppError(message, "FORBIDDEN", 403);
  }

  static notFound(message = "Resource not found"): AppError {
    return new AppError(message, "NOT_FOUND", 404);
  }

  static conflict(message: string): AppError {
    return new AppError(message, "CONFLICT", 409);
  }

  static rateLimited(message = "Too many requests"): AppError {
    return new AppError(message, "RATE_LIMITED", 429);
  }

  static badRequest(message: string): AppError {
    return new AppError(message, "BAD_REQUEST", 400);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function toAppError(error: unknown): AppError {
  if (isAppError(error)) return error;
  if (error instanceof Error) {
    return new AppError(error.message, "INTERNAL_ERROR", 500);
  }
  return new AppError("An unexpected error occurred", "INTERNAL_ERROR", 500);
}
