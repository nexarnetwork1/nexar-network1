/** Nexar Commerce merchant business model — used in pricing UI and onboarding. */
export const merchantCommerceConfig = {
  storeCreation: {
    label: "Store creation",
    amountUsd: 10,
    currency: "USD",
    description: "One-time activation fee to launch your Nexar Commerce store.",
  },
  subscription: {
    monthly: {
      label: "Monthly",
      amountUsd: 2,
      currency: "USD",
      intervalDays: 30,
      description: "Full merchant dashboard, catalog, orders, and analytics.",
    },
    yearly: {
      label: "Yearly",
      amountUsd: 20,
      currency: "USD",
      intervalDays: 365,
      description: "Save with annual billing — two months free vs monthly.",
    },
  },
  setupSteps: [
    { id: "store", label: "Create store", href: "/merchant/onboarding" },
    { id: "logo", label: "Upload logo & branding", href: "/merchant/store" },
    { id: "products", label: "Add products", href: "/merchant/products/new" },
    { id: "payments", label: "Connect wallet & payments", href: "/merchant/wallet" },
    { id: "plan", label: "Choose subscription plan", href: "/marketplace#pricing" },
  ],
} as const;
