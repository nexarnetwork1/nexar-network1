const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
};

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"'/]/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

export function stripHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

export function sanitizeString(input: string, maxLength = 1000): string {
  return escapeHtml(stripHtmlTags(input.trim())).slice(0, maxLength);
}

export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  maxLength = 1000
): T {
  const result = { ...obj };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === "string") {
      (result as Record<string, unknown>)[key] = sanitizeString(value, maxLength);
    }
  }
  return result;
}
