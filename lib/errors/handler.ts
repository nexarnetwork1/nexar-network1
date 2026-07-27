import { ZodError } from "zod";
import { captureException } from "@/lib/monitoring/sentry";
import { logger } from "@/lib/logging/logger";
import { AppError, isAppError, toAppError } from "./app-error";
import { validationErrorResponse } from "./validation-response";
import { apiErrorResponse } from "./api-response";

export type ErrorHandlerContext = {
  source?: string;
  userId?: string;
  requestId?: string;
};

export async function handleError(
  error: unknown,
  context?: ErrorHandlerContext
): Promise<Response> {
  if (error instanceof ZodError) {
    return validationErrorResponse(error);
  }

  const appError = toAppError(error);

  if (appError.statusCode >= 500) {
    logger.error(appError.message, {
      code: appError.code,
      source: context?.source,
      userId: context?.userId,
      requestId: context?.requestId,
      details: appError.details,
    });
    await captureException(appError, context);
  } else if (appError.statusCode >= 400) {
    logger.warn(appError.message, {
      code: appError.code,
      source: context?.source,
    });
  }

  return apiErrorResponse(appError);
}

export function handleServerActionError(
  error: unknown,
  context?: ErrorHandlerContext
): { success: false; error: string; code: string } {
  if (error instanceof ZodError) {
    const firstIssue = error.issues[0];
    return {
      success: false,
      error: firstIssue?.message ?? "Validation failed",
      code: "VALIDATION_ERROR",
    };
  }

  const appError = isAppError(error) ? error : toAppError(error);

  if (appError.statusCode >= 500) {
    logger.error(appError.message, { source: context?.source });
    void captureException(appError, context);
  }

  return {
    success: false,
    error: appError.message,
    code: appError.code,
  };
}
