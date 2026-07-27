export const posConfig = {
  enabled: false,
  deviceTypes: ["terminal", "tablet", "mobile"] as const,
  capabilities: {
    barcodeScanner: false,
    receiptPrinter: false,
    touchScreen: true,
  },
} as const;
