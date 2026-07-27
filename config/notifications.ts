export const notificationsConfig = {
  channels: ["email", "in_app", "sms", "push", "telegram"] as const,
  activeChannels: ["email", "in_app"] as const,
  futureChannels: ["sms", "push", "telegram"] as const,
  realtime: {
    enabled: true,
    channelPrefix: "nxr",
    tables: ["payment_sessions", "orders", "invoices", "notifications", "escrows", "disputes"],
  },
  events: {
    orderCreated: "order.created",
    paymentReceived: "payment.received",
    paymentFailed: "payment.failed",
    invoiceIssued: "invoice.issued",
    invoicePaid: "invoice.paid",
    settlementCompleted: "settlement.completed",
    refundIssued: "refund.issued",
    disputeOpened: "dispute.opened",
    disputeResolved: "dispute.resolved",
    merchantApproved: "merchant.approved",
    merchantRejected: "merchant.rejected",
    securityAlert: "security.alert",
    escrowReleased: "escrow.released",
    withdrawalApproved: "withdrawal.approved",
    withdrawalRejected: "withdrawal.rejected",
  },
} as const;

export type NotificationChannel = (typeof notificationsConfig.channels)[number];
