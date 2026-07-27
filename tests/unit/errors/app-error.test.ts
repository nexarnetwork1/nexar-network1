import { describe, expect, it } from "vitest";
import { AppError, isAppError, toAppError } from "@/lib/errors/app-error";

describe("AppError", () => {
  it("creates validation errors with 422", () => {
    const error = AppError.validation("Invalid field", { field: "email" });
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe("VALIDATION_ERROR");
  });

  it("creates auth errors", () => {
    expect(AppError.unauthorized().statusCode).toBe(401);
    expect(AppError.forbidden().statusCode).toBe(403);
    expect(AppError.rateLimited().statusCode).toBe(429);
  });

  it("identifies AppError instances", () => {
    expect(isAppError(AppError.notFound())).toBe(true);
    expect(isAppError(new Error("x"))).toBe(false);
  });

  it("wraps unknown errors", () => {
    const wrapped = toAppError(new Error("boom"));
    expect(wrapped.code).toBe("INTERNAL_ERROR");
    expect(wrapped.statusCode).toBe(500);
  });
});
