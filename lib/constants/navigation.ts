import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Founder", href: "#founder" },
  { label: "Whitepaper", href: "#whitepaper" },
  { label: "Market", href: "/market" },
  { label: "Contact", href: "/contact" },
];

export const FOOTER_LINKS = {
  quick: [
    { label: "About", href: "#about" },
    { label: "Founder", href: "#founder" },
    { label: "Whitepaper", href: "#whitepaper" },
    { label: "Market", href: "/market" },
    { label: "Contact", href: "/contact" },
  ],
  resources: [
    { label: "Whitepaper", href: "/whitepaper" },
    { label: "Documentation", href: "/whitepaper" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Disclaimer", href: "/disclaimer" },
  ],
} as const;
