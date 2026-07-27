import { describe, expect, it, vi } from "vitest";
import { AppError } from "@/lib/errors/app-error";
import { handleError, handleServerActionError } from "@/lib/errors/handler";

vi.mock("@/lib/monitoring/sentry", () => ({
  captureException: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/config/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/config/env")>();
  return {
    ...actual,
    isProduction: vi.fn(() => true),
  };
});

describe("error handler", () => {
  it("returns validation response for Zod errors", async () => {
    const { z } = await import("zod");
    const schema = z.object({ email: z.string().email() });
    try {
      schema.parse({ email: "bad" });
    } catch (error) {
      const response = await handleError(error, { source: "test" });
      expect(response.status).toBe(422);
    }
  });

  it("sanitizes internal errors in production", async () => {
    const response = await handleError(
      new AppError("Database connection leaked", "INTERNAL_ERROR", 500),
      { source: "test" }
    );
    const body = await response.json();
    expect(body.error.message).not.toContain("Database");
    expect(body.error.message).toContain("internal error");
  });

  it("returns structured server action errors", () => {
    const result = handleServerActionError(AppError.forbidden("No access"), {
      source: "action",
    });
    expect(result.success).toBe(false);
    expect(result.code).toBe("FORBIDDEN");
  });
});
