const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/i,
  /(--|\/\*|\*\/|;)/,
  /(\bOR\b\s+\d+\s*=\s*\d+)/i,
  /(\bAND\b\s+\d+\s*=\s*\d+)/i,
];

export function containsSqlInjectionPattern(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

export function assertSafeInput(input: string, fieldName = "input"): void {
  if (containsSqlInjectionPattern(input)) {
    throw new Error(`Potentially unsafe ${fieldName} detected`);
  }
}

export function validateSafeFields(
  fields: Record<string, string>
): Record<string, string> {
  for (const [key, value] of Object.entries(fields)) {
    assertSafeInput(value, key);
  }
  return fields;
}
