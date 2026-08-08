import { emailConfig } from "@/config/email";
import { deferBackground } from "@/lib/jobs/defer";
import { captureException } from "@/lib/monitoring/sentry";

export type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult = {
  success: boolean;
  error?: string;
};

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 750;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendEmailOnce(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = emailConfig.apiKey;

  if (!apiKey) {
    return { success: false, error: "Email not configured" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailConfig.from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const body = await response.text();
      return { success: false, error: body || response.statusText };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Send failed",
    };
  }
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const result = await sendEmailOnce(params);
    if (result.success) return result;

    lastError = result.error;
    const retryable =
      result.error?.includes("429") ||
      result.error?.includes("5") ||
      result.error?.toLowerCase().includes("timeout") ||
      result.error?.toLowerCase().includes("network");

    if (!retryable || attempt === MAX_ATTEMPTS) break;
    await sleep(RETRY_DELAY_MS * attempt);
  }

  deferBackground(() =>
    captureException(new Error("Email delivery failed"), {
      to: params.to,
      subject: params.subject,
      error: lastError,
    }),
  );

  return { success: false, error: lastError ?? "Send failed" };
}

export async function sendInvoiceReadyEmail(params: {
  to: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  storeName: string;
}): Promise<SendEmailResult> {
  const html = `
    <h2>Invoice ready</h2>
    <p>Hi ${escapeHtml(params.customerName)},</p>
    <p>Your invoice <strong>${escapeHtml(params.invoiceNumber)}</strong> from ${escapeHtml(params.storeName)} is ready.</p>
    <p>Amount: <strong>${params.currency} ${params.amount.toFixed(2)}</strong></p>
    <p>Sign in to Nexar Network to pay.</p>
  `;

  return sendEmail({
    to: params.to,
    subject: `Invoice ${params.invoiceNumber} — ${params.storeName}`,
    html,
    text: `Invoice ${params.invoiceNumber} from ${params.storeName}: ${params.currency} ${params.amount.toFixed(2)}`,
  });
}

export async function sendPaymentReceivedEmail(params: {
  to: string;
  recipientName: string;
  amount: number;
  invoiceNumber?: string;
  role: "customer" | "merchant";
}): Promise<SendEmailResult> {
  const html =
    params.role === "customer"
      ? `
    <h2>Payment confirmed</h2>
    <p>Hi ${escapeHtml(params.recipientName)},</p>
    <p>We received your payment of <strong>$${params.amount.toFixed(2)}</strong>${params.invoiceNumber ? ` for invoice ${escapeHtml(params.invoiceNumber)}` : ""}.</p>
  `
      : `
    <h2>Payment received</h2>
    <p>Hi ${escapeHtml(params.recipientName)},</p>
    <p>A customer payment of <strong>$${params.amount.toFixed(2)}</strong> was confirmed.</p>
  `;

  return sendEmail({
    to: params.to,
    subject:
      params.role === "customer"
        ? "Payment confirmed — Nexar Network"
        : "New payment received — Nexar Network",
    html,
    text: `Payment of $${params.amount.toFixed(2)} confirmed.`,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
