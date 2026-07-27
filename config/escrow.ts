export const escrowConfig = {
  defaultAutoReleaseDays: 7,
  requireDeliveryConfirmation: false,
  statuses: ["pending", "held", "released", "refunded", "cancelled"] as const,
  merchantWithdrawalBlockedWhileHeld: true,
} as const;
