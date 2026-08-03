import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Founder", href: "/#founder" },
  { label: "Whitepaper", href: "/#whitepaper" },
  { label: "Market", href: "/market" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Contact", href: "/#contact" },
];

export const FOOTER_LINKS = {
  quick: [
    { label: "About", href: "/#about" },
    { label: "Founder", href: "/#founder" },
    { label: "Whitepaper", href: "/#whitepaper" },
    { label: "Market", href: "/market" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Contact", href: "/#contact" },
  ],
  resources: [
    { label: "Whitepaper", href: "/whitepaper" },
    { label: "Official Addresses", href: "/official-addresses" },
    { label: "Documentation", href: "/whitepaper" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Disclaimer", href: "/disclaimer" },
  ],
} as const;

/** Shared class for native & custom dropdowns */
export const DROPDOWN_CLASS =
  "rounded-[14px] border border-border bg-surface/90 px-4 py-2.5 text-sm text-white shadow-[0_12px_40px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl outline-none transition-all duration-300 hover:border-gold focus:border-gold focus:ring-1 focus:ring-gold/25 appearance-none cursor-pointer";
