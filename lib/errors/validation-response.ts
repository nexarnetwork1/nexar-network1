import type { ZodError } from "zod";
import { AppError } from "./app-error";
import { apiErrorResponse } from "./api-response";

export type ValidationErrorBody = {
  success: false;
  error: {
    message: string;
    code: "VALIDATION_ERROR";
    fields: Record<string, string[]>;
  };
};

export function formatZodErrors(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    if (!fields[path]) fields[path] = [];
    fields[path].push(issue.message);
  }

  return fields;
}

export function validationErrorResponse(error: ZodError): Response {
  const fields = formatZodErrors(error);
  const body: ValidationErrorBody = {
    success: false,
    error: {
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      fields,
    },
  };

  return Response.json(body, { status: 422 });
}

export function toValidationAppError(error: ZodError): AppError {
  return AppError.validation("Validation failed", {
    fields: formatZodErrors(error),
  });
}
