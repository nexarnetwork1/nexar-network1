import type { ZodSchema } from "zod";
import { AppError } from "@/lib/errors";

export abstract class BaseService {
  protected assertFound<T>(value: T | null | undefined, resource: string): T {
    if (value == null) {
      throw AppError.notFound(`${resource} not found`);
    }
    return value;
  }

  protected validateInput<T>(schema: ZodSchema<T>, input: unknown): T {
    const result = schema.safeParse(input);
    if (!result.success) {
      throw AppError.validation("Validation failed", {
        fields: result.error.flatten().fieldErrors,
      });
    }
    return result.data;
  }
}
