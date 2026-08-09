import { COMMERCE_FAQ_ITEMS } from "@/lib/commerce/faq-content";
import { FEATURES } from "@/lib/data/features";
import { FOUNDER } from "@/lib/data/founder";
import { SITE, CONTRACTS, SOCIAL } from "@/lib/constants/site";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import type { SiteKnowledgeEntry } from "./types";

const commerceFaqById = Object.fromEntries(COMMERCE_FAQ_ITEMS.map((item) => [item.id, item]));

const featureSummary = FEATURES.map((f) => `${f.title}: ${f.description}`).join("\n");

const socialLinks = [
  { label: "Official website", href: SITE.url },
  { label: "X / Twitter", href: SOCIAL.x },
  { label: "Telegram", href: SOCIAL.telegram },
  { label: "Discord", href: SOCIAL.discord },
  { label: "GitHub", href: SOCIAL.github },
  { label: "LinkedIn (Founder)", href: SOCIAL.linkedin },
  { label: "Instagram", href: SOCIAL.instagram },
  { label: "Facebook", href: SOCIAL.facebook },
  { label: "TikTok", href: SOCIAL.tiktok },
  { label: "Binance Square", href: SOCIAL.binanceSquare },
];

/** Extended Nexar knowledge derived from verified repository content. */
export const NEXAR_KNOWLEDGE: SiteKnowledgeEntry[] = [
  {
    id: "official-website",
    title: "Official website",
    keywords: ["website", "official site", "nexarnetwork", "url", "domain", "homepage"],
    answer: `The official Nexar Network website is ${SITE.url}. It hosts the NXR token overview, whitepaper, market page, Nexar Commerce marketplace, and community links.`,
    links: [
      { label: "Nexar Network", href: SITE.url },
      { label: "Homepage", href: "/" },
      { label: "Whitepaper", href: "/whitepaper" },
    ],
    primaryLink: SITE.url,
  },
  {
    id: "presale",
    title: "NXR Presale",
    keywords: [
      "presale",
      "public sale",
      "buy nxr",
      "participate",
      "how to buy",
      "early access",
      "token sale",
      "ico",
    ],
    answer: `Nexar Network is running a public presale as part of its Q3 2026 Foundation roadmap phase. NXR presale allocation: 100,000,000 NXR (20% of max supply). Visit the Market page at ${SITE.url}/market for NXR token and presale contract details. Presale smart contract: ${CONTRACTS.presale}. Token contract: ${CONTRACTS.token}. Trading pairs and DEX listings are planned after the presale concludes.`,
    links: [
      { label: "NXR Market / Presale", href: "/market" },
      { label: "Official addresses", href: "/official-addresses" },
      { label: "Whitepaper tokenomics", href: "/whitepaper#tokenomics" },
      { label: "BscScan presale", href: `https://bscscan.com/address/${CONTRACTS.presale}` },
    ],
    primaryLink: "/market",
  },
  {
    id: "payment-ecosystem",
    title: "Payment ecosystem",
    keywords: [
      "payment ecosystem",
      "payment rails",
      "global payments",
      "settlement",
      "merchant payments",
      "invoice",
      "qr payment",
    ],
    answer: `Nexar Network provides enterprise-grade global payment rails on ${SITE.blockchain}. The ecosystem includes Nexar Pay for merchant payment infrastructure, marketplace checkout, merchant invoices, QR payments, and NXR/USDT settlement with platform-controlled fees. ${FEATURES.find((f) => f.id === "payments")?.description ?? ""}`,
    links: [
      { label: "Marketplace", href: MARKETPLACE_ROUTES.root },
      { label: "Market / NXR", href: "/market" },
      { label: "Whitepaper", href: "/whitepaper#nexar-solution" },
    ],
    primaryLink: MARKETPLACE_ROUTES.root,
  },
  {
    id: "commerce-ecosystem",
    title: "Nexar Commerce ecosystem",
    keywords: [
      "nexar commerce",
      "commerce ecosystem",
      "decentralized marketplace",
      "online store",
      "ecommerce",
      "e-commerce",
    ],
    answer:
      "Nexar Commerce is the enterprise marketplace on Nexar Network. Merchants register, create verified stores, list products, and accept crypto and card payments. Customers browse the marketplace, add items to cart and wishlist, checkout securely, and manage orders from their customer dashboard. Store creation requires merchant registration and approval before appearing in the marketplace directory.",
    links: [
      { label: "Nexar Commerce", href: MARKETPLACE_ROUTES.root },
      { label: "Become a merchant", href: `${MARKETPLACE_ROUTES.root}?mode=register` },
      { label: "Whitepaper marketplace", href: "/whitepaper#marketplace" },
    ],
    primaryLink: MARKETPLACE_ROUTES.root,
  },
  {
    id: "store-creation",
    title: "Store creation",
    keywords: ["create store", "open store", "launch store", "store setup", "onboarding", "store price", "store cost"],
    answer: commerceFaqById["create-store"]?.answer ?? "",
    links: [
      { label: "Merchant onboarding", href: "/merchant/onboarding" },
      { label: "Register as merchant", href: `${MARKETPLACE_ROUTES.root}?mode=register` },
      { label: "Commerce FAQ", href: `${MARKETPLACE_ROUTES.root}#faq` },
    ],
    primaryLink: "/merchant/onboarding",
  },
  {
    id: "commerce-pricing",
    title: "Merchant pricing",
    keywords: ["subscription", "merchant plan", "monthly plan", "yearly plan", "store fee", "pricing", "merchant cost"],
    answer: `${commerceFaqById["store-price"]?.answer ?? ""}\n\n${commerceFaqById["subscriptions"]?.answer ?? ""}`,
    links: [
      { label: "Commerce pricing", href: `${MARKETPLACE_ROUTES.root}#pricing` },
      { label: "Become a merchant", href: `${MARKETPLACE_ROUTES.root}?mode=register` },
    ],
    primaryLink: `${MARKETPLACE_ROUTES.root}#pricing`,
  },
  {
    id: "commerce-payments",
    title: "Commerce payment methods",
    keywords: [
      "payment methods",
      "checkout payment",
      "usdt",
      "usdc",
      "bnb",
      "crypto checkout",
      "card payment",
      "wallet pay",
      "metamask",
      "trust wallet",
    ],
    answer: `${commerceFaqById["payment-methods"]?.answer ?? ""}\n\n${commerceFaqById["wallets"]?.answer ?? ""}\n\n${commerceFaqById["merchant-fees"]?.answer ?? ""}`,
    links: [
      { label: "Marketplace checkout", href: MARKETPLACE_ROUTES.checkout },
      { label: "Commerce FAQ", href: `${MARKETPLACE_ROUTES.root}#faq` },
    ],
    primaryLink: MARKETPLACE_ROUTES.checkout,
  },
  {
    id: "technology",
    title: "Technology",
    keywords: [
      "technology",
      "blockchain payments",
      "security",
      "transparency",
      "scalability",
      "smart contract",
      "bsc",
      "bnb smart chain",
      "infrastructure",
    ],
    answer: `Nexar Network technology pillars:\n${featureSummary}\n\nSecurity highlights: mint permanently disabled, verified smart contracts on BscScan, transparent token allocation, dedicated allocation wallets, team vesting contracts, and a public roadmap.`,
    links: [
      { label: "Whitepaper technology", href: "/whitepaper#technology-overview" },
      { label: "Security section", href: "/whitepaper#security" },
      { label: "Official addresses", href: "/official-addresses" },
    ],
    primaryLink: "/whitepaper#technology-overview",
  },
  {
    id: "token-utility",
    title: "NXR token utility",
    keywords: ["utility", "use case", "what is nxr used for", "token use", "gas fees", "staking", "governance"],
    answer:
      "NXR utility inside the Nexar ecosystem includes: global payments, merchant payments, wallet transfers, community rewards, ecosystem services, and planned future governance, staking, validator rewards, and network gas fees on Nexar Chain.",
    links: [
      { label: "Token utility", href: "/whitepaper#token-utility" },
      { label: "Tokenomics", href: "/#tokenomics" },
      { label: "Market", href: "/market" },
    ],
    primaryLink: "/whitepaper#token-utility",
  },
  {
    id: "official-addresses",
    title: "Official addresses",
    keywords: ["contract address", "wallet address", "official address", "bscscan", "treasury", "vesting"],
    answer: `Official Nexar Network blockchain addresses on ${SITE.blockchain}:\n• NXR Token: ${CONTRACTS.token}\n• Presale: ${CONTRACTS.presale}\n• Treasury: ${CONTRACTS.treasury}\n• Team Vesting: ${CONTRACTS.teamVesting}\n\nVerify all addresses on BscScan before transacting.`,
    links: [
      { label: "Official addresses page", href: "/official-addresses" },
      { label: "BscScan token", href: `https://bscscan.com/token/${CONTRACTS.token}` },
      { label: "Market page", href: "/market" },
    ],
    primaryLink: "/official-addresses",
  },
  {
    id: "social-links",
    title: "Official social links",
    keywords: [
      "social",
      "twitter",
      "x",
      "telegram",
      "discord",
      "github",
      "instagram",
      "facebook",
      "tiktok",
      "community",
      "follow",
    ],
    answer: `Official Nexar Network community channels:\n${socialLinks.map((link) => `• ${link.label}: ${link.href}`).join("\n")}`,
    links: socialLinks.slice(0, 6),
    primaryLink: SOCIAL.telegram,
  },
  {
    id: "founder-mission",
    title: "Founder mission",
    keywords: ["founder mission", "ceo vision", "mahmoud vision", "who is mahmoud", "leadership"],
    answer: `${FOUNDER.name} is the ${FOUNDER.role} of Nexar Network.\n\n${FOUNDER.bio}\n\nMission quote: "${FOUNDER.quote}"`,
    links: [
      { label: "Founder section", href: "/#founder" },
      { label: "Whitepaper founder", href: "/whitepaper#founder" },
      { label: "LinkedIn", href: FOUNDER.linkedin },
    ],
    primaryLink: "/#founder",
  },
  {
    id: "commerce-checkout",
    title: "Commerce checkout",
    keywords: ["how to checkout", "how to buy products", "order process", "purchase flow", "cart checkout"],
    answer: `${commerceFaqById["checkout"]?.answer ?? ""}\n\n${commerceFaqById["orders"]?.answer ?? ""}`,
    links: [
      { label: "Marketplace cart", href: MARKETPLACE_ROUTES.cart },
      { label: "Checkout", href: MARKETPLACE_ROUTES.checkout },
      { label: "Customer orders", href: "/customer/orders" },
    ],
    primaryLink: MARKETPLACE_ROUTES.checkout,
  },
];
