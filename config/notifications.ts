export const notificationsConfig = {
  channels: ["email", "in_app"] as const,
  realtime: {
    enabled: true,
    channelPrefix: "nxr",
  },
  events: {
    orderCreated: "order.created",
    paymentReceived: "payment.received",
    invoiceIssued: "invoice.issued",
    settlementCompleted: "settlement.completed",
  },
} as const;

export type NotificationChannel = (typeof notificationsConfig.channels)[number];
