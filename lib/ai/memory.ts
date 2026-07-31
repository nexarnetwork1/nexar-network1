/** Prompt injection and abuse patterns to strip from user input. */
const INJECTION_PATTERNS = [
  /ignore (all )?(previous|prior|above) instructions?/gi,
  /disregard (all )?(previous|prior|above) instructions?/gi,
  /you are now (a|an) /gi,
  /system prompt:/gi,
  /\[system\]/gi,
  /<\/?system>/gi,
  /reveal (your )?(api key|secret|password)/gi,
];

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

/** Sanitize user message before sending to OpenAI or local resolver. */
export function sanitizeUserMessage(input: string): string {
  let text = input.trim().slice(0, 1000);
  text = text.replace(CONTROL_CHARS, "");
  for (const pattern of INJECTION_PATTERNS) {
    text = text.replace(pattern, "");
  }
  return text.trim();
}

export function isEmptyAfterSanitize(input: string): boolean {
  return sanitizeUserMessage(input).length === 0;
}
