import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "#about" },
  { label: "Founder", href: "#founder" },
  { label: "Whitepaper", href: "#whitepaper" },
  { label: "Market", href: "/market" },
  { label: "Business Hub", href: "/business", hasMegaMenu: true },
  { label: "Contact", href: "/contact" },
];

export const BUSINESS_HUB_MEGA_MENU = {
  business: {
    title: "Business",
    items: [
      { label: "Merchant Dashboard", href: "/business/merchant-dashboard", description: "Manage your payments" },
      { label: "Payment Gateway", href: "/business/payment-gateway", description: "Integrate payments" },
      { label: "Checkout", href: "/checkout", description: "Payment experience" },
      { label: "Payment Links", href: "/business/payment-links", description: "Shareable links" },
      { label: "Invoices", href: "/dashboard/invoices", description: "Billing system" },
    ],
  },
  developers: {
    title: "Developers",
    items: [
      { label: "API", href: "/business/api", description: "REST API" },
      { label: "SDKs", href: "/business/sdks", description: "Developer tools" },
      { label: "Documentation", href: "/business/documentation", description: "Integration guides" },
    ],
  },
  resources: {
    title: "Resources",
    items: [
      { label: "Pricing", href: "/business/pricing", description: "Fee structure" },
      { label: "Roadmap", href: "/business/roadmap", description: "Future plans" },
      { label: "Status", href: "/business/status", description: "System status" },
    ],
  },
  comingSoon: {
    title: "Coming Soon",
    items: [
      { label: "POS", href: "/pos", description: "Point of sale" },
      { label: "Mobile App", href: "/mobile", description: "iOS & Android" },
      { label: "Subscriptions", href: "/subscriptions", description: "Recurring payments" },
    ],
  },
};

export const FOOTER_LINKS = {
  quick: [
    { label: "About", href: "#about" },
    { label: "Founder", href: "#founder" },
    { label: "Whitepaper", href: "#whitepaper" },
    { label: "Market", href: "/market" },
    { label: "Contact", href: "/contact" },
  ],
  resources: [
    { label: "Whitepaper", href: "#whitepaper" },
    { label: "Official Addresses", href: "/official-addresses" },
    { label: "Documentation", href: "/docs" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Disclaimer", href: "/disclaimer" },
  ],
} as const;
