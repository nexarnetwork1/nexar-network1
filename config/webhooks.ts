export const webhooksConfig = {
  maxRetries: 5,
  retryDelayMs: [60_000, 300_000, 900_000, 3_600_000, 14_400_000],
  signatureHeader: "x-nexar-signature",
  events: [
    "payment.success",
    "payment.failure",
    "refund",
    "order.created",
    "invoice.paid",
  ] as const,
} as const;
