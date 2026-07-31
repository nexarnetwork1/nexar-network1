import { FOOTER_LINKS, NAV_ITEMS } from "@/lib/constants/navigation";
import { SITE, CONTRACTS, SOCIAL } from "@/lib/constants/site";
import { FOUNDER } from "@/lib/data/founder";
import { ROADMAP } from "@/lib/data/roadmap";
import { TOKENOMICS, MAX_SUPPLY } from "@/lib/data/tokenomics";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import { NEXAR_KNOWLEDGE } from "./nexar-knowledge";
import type { SiteKnowledgeEntry, SiteKnowledgeLink } from "./types";

export type { SiteKnowledgeEntry, SiteKnowledgeLink };

const allocationSummary = TOKENOMICS.map(
  (item) => `${item.title} ${item.percent}% (${item.value.toLocaleString()} NXR)`,
).join("; ");

const roadmapSummary = ROADMAP.map(
  (phase) => `${phase.quarter} — ${phase.title}: ${phase.items.slice(0, 3).join(", ")}`,
).join("\n");

const navSummary = NAV_ITEMS.map((item) => `${item.label} → ${item.href}`).join("\n");

/** Curated site knowledge for the global Nexar Assistant (demo + future AI grounding). */
const CORE_SITE_KNOWLEDGE: SiteKnowledgeEntry[] = [
  {
    id: "nexar-network",
    title: "Nexar Network",
    keywords: [
      "what is nexar",
      "nexar network",
      "about nexar",
      "company",
      "vision",
      "mission",
      "who are you",
      "what do you do",
    ],
    answer: `${SITE.name} is a premium blockchain ecosystem focused on global payments. ${SITE.description} The NXR token (${SITE.ticker}) powers the network on ${SITE.blockchain}. Official website: ${SITE.url}.`,
    links: [
      { label: "About Nexar", href: "/#about" },
      { label: "Whitepaper", href: "/whitepaper" },
      { label: "Marketplace", href: MARKETPLACE_ROUTES.root },
    ],
    primaryLink: "/#about",
  },
  {
    id: "vision",
    title: "Company vision",
    keywords: ["vision", "mission", "goal", "purpose", "why nexar", "future"],
    answer: `${SITE.tagline} Nexar Network is building the future of global blockchain payments — evolving from BEP-20 on BNB Smart Chain toward sovereign Nexar Chain infrastructure for enterprises, merchants, and communities worldwide.`,
    links: [
      { label: "About section", href: "/#about" },
      { label: "Read whitepaper", href: "/whitepaper" },
    ],
    primaryLink: "/#about",
  },
  {
    id: "founder",
    title: "Founder",
    keywords: ["founder", "ceo", "mahmoud", "elgabry", "who built", "who created"],
    answer: `${FOUNDER.name} is the ${FOUNDER.role} of Nexar Network. ${FOUNDER.bio}\n\n"${FOUNDER.quote}"`,
    links: [
      { label: "Founder section", href: "/#founder" },
      { label: "LinkedIn", href: FOUNDER.linkedin },
    ],
    primaryLink: "/#founder",
  },
  {
    id: "whitepaper",
    title: "Whitepaper",
    keywords: ["whitepaper", "white paper", "documentation", "docs", "technical paper"],
    answer:
      "The official Nexar Network Whitepaper covers vision, technology, ecosystem design, tokenomics, security, and the path to sovereign chain infrastructure.",
    links: [
      { label: "Open whitepaper", href: "/whitepaper" },
      { label: "Tokenomics section", href: "/whitepaper#tokenomics" },
      { label: "Roadmap section", href: "/whitepaper#roadmap" },
    ],
    primaryLink: "/whitepaper",
  },
  {
    id: "tokenomics",
    title: "Tokenomics",
    keywords: ["tokenomics", "supply", "allocation", "distribution", "vesting", "max supply"],
    answer: `NXR max supply: ${MAX_SUPPLY.toLocaleString()} tokens. Mint is ${SITE.mint.toLowerCase()}. Allocations: ${allocationSummary}.`,
    links: [
      { label: "Tokenomics", href: "/#tokenomics" },
      { label: "Whitepaper tokenomics", href: "/whitepaper#tokenomics" },
      { label: "Official addresses", href: "/official-addresses" },
    ],
    primaryLink: "/#tokenomics",
  },
  {
    id: "nxr-token",
    title: "NXR Token",
    keywords: ["nxr", "token", "coin", "cryptocurrency", "bep20", "contract", "buy nxr"],
    answer: `NXR (${SITE.ticker}) is the native utility token of Nexar Network on ${SITE.blockchain}. Max supply ${SITE.maxSupply} with ${SITE.decimals} decimals. Contract: ${CONTRACTS.token}. Presale contract: ${CONTRACTS.presale}.`,
    links: [
      { label: "Market / Presale", href: "/market" },
      { label: "Tokenomics", href: "/#tokenomics" },
      { label: "Official addresses", href: "/official-addresses" },
    ],
    primaryLink: "/market",
  },
  {
    id: "roadmap",
    title: "Roadmap",
    keywords: ["roadmap", "timeline", "milestones", "quarter", "plans", "future"],
    answer: `Nexar Network roadmap:\n${roadmapSummary}`,
    links: [
      { label: "Roadmap section", href: "/#roadmap" },
      { label: "Whitepaper roadmap", href: "/whitepaper#roadmap" },
    ],
    primaryLink: "/#roadmap",
  },
  {
    id: "marketplace",
    title: "Marketplace",
    keywords: [
      "marketplace",
      "shop",
      "buy products",
      "shopping",
      "store",
      "commerce",
      "products",
      "where can i buy",
    ],
    answer:
      "Nexar Commerce is the enterprise marketplace on Nexar Network. Browse verified merchants, search products, add to cart, wishlist items, and checkout with crypto or card.",
    links: [
      { label: "Marketplace home", href: MARKETPLACE_ROUTES.root },
      { label: "Cart", href: MARKETPLACE_ROUTES.cart },
    ],
    primaryLink: MARKETPLACE_ROUTES.root,
  },
  {
    id: "merchant",
    title: "Merchant features",
    keywords: [
      "merchant",
      "sell",
      "storefront",
      "become a merchant",
      "start selling",
      "vendor",
      "seller",
      "create store",
    ],
    answer:
      "Merchants can register on Nexar Commerce, create a storefront, list products, manage orders, accept crypto and card payments, track revenue, and use the merchant dashboard. New stores are reviewed before going live on the marketplace.",
    links: [
      { label: "Become a merchant", href: `${MARKETPLACE_ROUTES.root}?auth=register&role=merchant` },
      { label: "Merchant dashboard", href: "/merchant" },
      { label: "Marketplace", href: MARKETPLACE_ROUTES.root },
    ],
    primaryLink: `${MARKETPLACE_ROUTES.root}?auth=register&role=merchant`,
  },
  {
    id: "customer",
    title: "Customer features",
    keywords: ["customer", "buyer", "account", "orders", "purchases", "wishlist", "cart"],
    answer:
      "Customers shop on Nexar Commerce — browse products, manage cart and wishlist, and checkout securely. Account settings, orders, invoices, and wallet are available from your customer account area.",
    links: [
      { label: "Marketplace", href: MARKETPLACE_ROUTES.root },
      { label: "Orders", href: "/customer/orders" },
      { label: "Sign in", href: `${MARKETPLACE_ROUTES.root}?auth=signin` },
    ],
    primaryLink: MARKETPLACE_ROUTES.root,
  },
  {
    id: "payments",
    title: "Payments",
    keywords: ["payment", "pay", "checkout", "crypto", "usdt", "bsc", "invoice", "wallet pay"],
    answer:
      "Nexar supports global payment rails on BNB Smart Chain with enterprise checkout, merchant invoices, QR payments, and NXR/USDT settlement. Marketplace checkout creates secure invoices per store.",
    links: [
      { label: "Marketplace checkout", href: MARKETPLACE_ROUTES.checkout },
      { label: "Market / NXR", href: "/market" },
    ],
    primaryLink: MARKETPLACE_ROUTES.root,
  },
  {
    id: "navigation",
    title: "Navigation",
    keywords: ["navigate", "menu", "pages", "where is", "find", "site map", "links"],
    answer: `Main navigation on Nexar Network:\n${navSummary}\n\nLegal: ${FOOTER_LINKS.legal.map((l) => l.label).join(", ")}.`,
    links: NAV_ITEMS.map((item) => ({ label: item.label, href: item.href })),
    primaryLink: "/",
  },
  {
    id: "contact",
    title: "Contact",
    keywords: ["contact", "support", "email", "reach", "help", "community"],
    answer:
      "Reach the Nexar Network community on Telegram, X, Discord, and LinkedIn. Use the contact section on the homepage for inquiries.",
    links: [
      { label: "Contact section", href: "/#contact" },
      { label: "Telegram", href: SOCIAL.telegram },
      { label: "X / Twitter", href: SOCIAL.x },
    ],
    primaryLink: "/#contact",
  },
  {
    id: "faq",
    title: "FAQ",
    keywords: ["faq", "question", "help", "how does", "how do i"],
    answer:
      "Common topics: Nexar Network vision, NXR tokenomics, marketplace shopping, merchant onboarding, payments, and roadmap. Ask me a specific question or choose a suggestion below.",
    links: [
      { label: "Marketplace FAQ", href: `${MARKETPLACE_ROUTES.root}#faq` },
      { label: "Disclaimer", href: "/disclaimer" },
    ],
    primaryLink: `${MARKETPLACE_ROUTES.root}#faq`,
  },
  {
    id: "privacy",
    title: "Privacy",
    keywords: ["privacy", "data", "gdpr", "personal information"],
    answer: "Read the Nexar Network Privacy Policy for how we handle data and your rights.",
    links: [{ label: "Privacy Policy", href: "/privacy" }],
    primaryLink: "/privacy",
  },
  {
    id: "terms",
    title: "Terms",
    keywords: ["terms", "tos", "terms of service", "legal", "agreement"],
    answer: "The Terms of Service govern use of Nexar Network and Nexar Commerce.",
    links: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Disclaimer", href: "/disclaimer" },
    ],
    primaryLink: "/terms",
  },
  {
    id: "admin",
    title: "Admin",
    keywords: ["admin", "dashboard", "cms", "super admin", "treasury"],
    answer:
      "The Nexar admin dashboard is restricted to authorized treasury wallet holders. Connect your wallet at the admin login to manage platform operations.",
    links: [{ label: "Admin login", href: "/admin/login" }],
    primaryLink: "/admin/login",
  },
];

export const SITE_KNOWLEDGE: SiteKnowledgeEntry[] = [...CORE_SITE_KNOWLEDGE, ...NEXAR_KNOWLEDGE];

export const ASSISTANT_SUGGESTED_PROMPTS = [
  "What is Nexar Network?",
  "Open Whitepaper",
  "Who is the founder?",
  "How do I join the NXR presale?",
  "How do I become a merchant?",
  "Take me to Marketplace",
  "Explain NXR token utility",
  "Official social links",
] as const;

/** Alias map for natural navigation commands. */
export const NAVIGATION_ALIASES: Record<string, string> = {
  home: "/",
  about: "/#about",
  founder: "/#founder",
  whitepaper: "/whitepaper",
  paper: "/whitepaper",
  docs: "/whitepaper",
  tokenomics: "/#tokenomics",
  roadmap: "/#roadmap",
  market: "/market",
  presale: "/market",
  marketplace: MARKETPLACE_ROUTES.root,
  shop: MARKETPLACE_ROUTES.root,
  cart: MARKETPLACE_ROUTES.cart,
  wishlist: MARKETPLACE_ROUTES.wishlist,
  checkout: MARKETPLACE_ROUTES.checkout,
  merchant: "/merchant",
  "merchant dashboard": "/merchant",
  customer: MARKETPLACE_ROUTES.root,
  contact: "/#contact",
  faq: `${MARKETPLACE_ROUTES.root}#faq`,
  privacy: "/privacy",
  terms: "/terms",
  disclaimer: "/disclaimer",
  admin: "/admin/login",
  addresses: "/official-addresses",
  discord: SOCIAL.discord,
  telegram: SOCIAL.telegram,
  github: SOCIAL.github,
  twitter: SOCIAL.x,
  x: SOCIAL.x,
  instagram: SOCIAL.instagram,
  facebook: SOCIAL.facebook,
  tiktok: SOCIAL.tiktok,
  website: SITE.url,
};
