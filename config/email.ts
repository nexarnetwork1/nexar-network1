import { env } from "./env";

export const emailConfig = {
  provider: "resend" as const,
  apiKey: env.RESEND_API_KEY ?? null,
  from: env.EMAIL_FROM ?? "Nexar Network <noreply@nexarnetwork.com>",
  templates: {
    welcome: "welcome",
    orderConfirmation: "order-confirmation",
    paymentReceived: "payment-received",
    invoiceReady: "invoice-ready",
    passwordReset: "password-reset",
  },
} as const;

export type EmailTemplate = (typeof emailConfig.templates)[keyof typeof emailConfig.templates];
