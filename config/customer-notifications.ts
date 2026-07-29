import { notificationsConfig } from "@/config/notifications";

export const customerNotificationEvents = [
  {
    event: notificationsConfig.events.paymentReceived,
    label: "Payment updates",
    description: "Payment received or confirmed on your orders",
  },
  {
    event: notificationsConfig.events.paymentFailed,
    label: "Payment failures",
    description: "Failed or expired payment attempts",
  },
  {
    event: notificationsConfig.events.invoiceIssued,
    label: "New invoices",
    description: "Invoices issued by merchants",
  },
  {
    event: notificationsConfig.events.invoicePaid,
    label: "Invoice paid",
    description: "When invoice payments complete",
  },
  {
    event: notificationsConfig.events.disputeOpened,
    label: "Disputes opened",
    description: "When a dispute is opened on your order",
  },
  {
    event: notificationsConfig.events.disputeResolved,
    label: "Disputes resolved",
    description: "When a dispute is closed",
  },
  {
    event: notificationsConfig.events.refundIssued,
    label: "Refunds",
    description: "When a refund is issued to you",
  },
  {
    event: notificationsConfig.events.escrowReleased,
    label: "Escrow releases",
    description: "When escrow funds are released",
  },
  {
    event: notificationsConfig.events.securityAlert,
    label: "Security alerts",
    description: "Important account and login alerts",
  },
] as const;

export type CustomerNotificationEvent =
  (typeof customerNotificationEvents)[number]["event"];

export const customerNotificationChannels = [
  {
    id: "in_app" as const,
    label: "In-app",
    description: "Shown in your notification center",
    active: true,
  },
  {
    id: "email" as const,
    label: "Email",
    description: "Sent to your account email",
    active: true,
  },
  {
    id: "sms" as const,
    label: "SMS",
    description: "Coming soon",
    active: false,
  },
  {
    id: "push" as const,
    label: "Push",
    description: "Coming soon",
    active: false,
  },
  {
    id: "telegram" as const,
    label: "Telegram",
    description: "Coming soon",
    active: false,
  },
];

export const activeCustomerNotificationChannels = customerNotificationChannels.filter(
  (channel) => channel.active
);
