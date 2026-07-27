import { env } from "@/config/env";

export function buildQrPayload(secretToken: string): string {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return `${base}/api/qr/${secretToken}`;
}

export function buildInvoicePayUrl(shareToken: string): string {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return `${base}/pay/i/${shareToken}`;
}
