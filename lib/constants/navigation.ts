import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "#home" },
  { label: "About", href: "#about" },
  { label: "Technology", href: "#technology" },
  { label: "Tokenomics", href: "#tokenomics" },
  { label: "Ecosystem", href: "#ecosystem" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "Security", href: "#security" },
  { label: "Founder", href: "#founder" },
  { label: "Whitepaper", href: "#whitepaper" },
];

export const FOOTER_LINKS = {
  quick: [
    { label: "About", href: "#about" },
    { label: "Technology", href: "#technology" },
    { label: "Tokenomics", href: "#tokenomics" },
    { label: "Ecosystem", href: "#ecosystem" },
    { label: "Roadmap", href: "#roadmap" },
  ],
  resources: [
    { label: "Whitepaper", href: "/whitepaper" },
    { label: "Security", href: "#security" },
    { label: "Founder", href: "#founder" },
    { label: "Documentation", href: "/whitepaper" },
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Disclaimer", href: "/disclaimer" },
  ],
} as const;
