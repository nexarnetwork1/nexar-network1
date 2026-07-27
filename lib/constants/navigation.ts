import type { NavItem } from "@/types";

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/#about" },
  { label: "Founder", href: "/#founder" },
  { label: "Whitepaper", href: "/#whitepaper" },
  { label: "Market", href: "/market" },
  { label: "Presale", href: "/presale" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Contact", href: "/#contact" },
];

export const FOOTER_LINKS = {
  quick: [
    { label: "About", href: "/#about" },
    { label: "Founder", href: "/#founder" },
    { label: "Whitepaper", href: "/#whitepaper" },
    { label: "Market", href: "/market" },
    { label: "Presale", href: "/presale" },
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
  "rounded-xl border border-border/80 bg-card/70 px-4 py-3 text-sm text-white shadow-lg shadow-black/20 backdrop-blur-xl outline-none transition-all duration-200 hover:border-gold/25 focus:border-gold/40 focus:ring-2 focus:ring-gold/15 appearance-none";
