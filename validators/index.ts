import { z } from "zod";

export function createFormValidator<T extends z.ZodType>(schema: T) {
  return (input: unknown) => schema.safeParse(input);
}

export function parseOrThrow<T extends z.ZodType>(
  schema: T,
  input: unknown
): z.infer<T> {
  return schema.parse(input);
}

export function getFieldErrors(error: z.ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_root";
    if (!fields[path]) fields[path] = [];
    fields[path].push(issue.message);
  }
  return fields;
}
