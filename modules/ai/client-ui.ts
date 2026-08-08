/**
 * Client-safe assistant UI helpers.
 * Must not import server-only modules, repositories, or OpenAI clients.
 */

/** Contextual loading copy for the ATLAS AI chat panel. */
export function inferLoadingMessage(message: string): string {
  const q = message.toLowerCase();
  if (/\b(price|convert|nxr|usd|egp|eur|market)\b/.test(q)) {
    return "Checking live market data…";
  }
  if (/\b(whitepaper|tokenomics|roadmap|vision)\b/.test(q)) {
    return "Reading the Whitepaper…";
  }
  if (/\b(product|find|search|shop|marketplace)\b/.test(q)) {
    return "Finding products…";
  }
  if (/\b(convert|calculat)\b/.test(q)) {
    return "Calculating conversion…";
  }
  return "Thinking…";
}
