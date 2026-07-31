import { FEATURES } from "@/lib/data/features";
import { FOUNDER } from "@/lib/data/founder";
import { ROADMAP } from "@/lib/data/roadmap";
import { TOKENOMICS, MAX_SUPPLY } from "@/lib/data/tokenomics";
import { SITE } from "@/lib/constants/site";
import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import type { AssistantPageContext, AssistantPageType } from "../global-assistant/types";

export type PageKnowledgeEntry = {
  pageTypes: AssistantPageType[];
  pathPrefixes: string[];
  title: string;
  summary: string;
  sections?: { id: string; title: string; summary: string }[];
  keywords: string[];
};

/** Dynamic page knowledge derived from actual site content (no duplication with curated answers). */
export const PAGE_KNOWLEDGE: PageKnowledgeEntry[] = [
  {
    pageTypes: ["home"],
    pathPrefixes: ["/"],
    title: "Home",
    summary: `${SITE.name} homepage — enterprise blockchain payments, NXR token, marketplace, and global merchant infrastructure.`,
    sections: FEATURES.map((f) => ({ id: f.id, title: f.title, summary: f.description })),
    keywords: ["home", "landing", "nexar network"],
  },
  {
    pageTypes: ["about"],
    pathPrefixes: ["/about", "/#about"],
    title: "About",
    summary:
      "Nexar Network connects traditional commerce with blockchain payments for merchants and customers worldwide with platform-controlled settlement. The platform includes a decentralized marketplace where merchants create stores and customers pay using NXR and supported cryptocurrencies.",
    keywords: ["about", "company", "mission"],
  },
  {
    pageTypes: ["whitepaper"],
    pathPrefixes: ["/whitepaper"],
    title: "Whitepaper",
    summary: "Official technical and strategic document for Nexar Network ecosystem, tokenomics, security, and roadmap.",
    sections: [
      { id: "tokenomics", title: "Tokenomics", summary: `Max supply ${MAX_SUPPLY.toLocaleString()} NXR with defined allocations.` },
      { id: "roadmap", title: "Roadmap", summary: ROADMAP.map((p) => `${p.quarter}: ${p.title}`).join(". ") },
      { id: "founder", title: "Founder", summary: `${FOUNDER.name} — ${FOUNDER.role}. ${FOUNDER.quote}` },
    ],
    keywords: ["whitepaper", "documentation", "technical"],
  },
  {
    pageTypes: ["marketplace", "shop"],
    pathPrefixes: [MARKETPLACE_ROUTES.root, MARKETPLACE_ROUTES.shop],
    title: "Marketplace",
    summary: "Browse verified merchants, filter products, add to cart, wishlist, and checkout on Nexar Commerce.",
    keywords: ["marketplace", "shop", "browse"],
  },
  {
    pageTypes: ["cart"],
    pathPrefixes: [MARKETPLACE_ROUTES.cart],
    title: "Cart",
    summary: "Review cart items and proceed to secure marketplace checkout.",
    keywords: ["cart", "basket"],
  },
  {
    pageTypes: ["checkout"],
    pathPrefixes: [MARKETPLACE_ROUTES.checkout],
    title: "Checkout",
    summary: "Complete your order — one invoice per store, pay securely with supported methods.",
    keywords: ["checkout", "pay", "order"],
  },
  {
    pageTypes: ["wishlist"],
    pathPrefixes: [MARKETPLACE_ROUTES.wishlist],
    title: "Wishlist",
    summary: "Saved products you want to purchase later on Nexar Commerce.",
    keywords: ["wishlist", "saved", "favorites"],
  },
  {
    pageTypes: ["merchant"],
    pathPrefixes: ["/merchant"],
    title: "Merchant Dashboard",
    summary: "Manage products, orders, invoices, store settings, revenue, and payments.",
    keywords: ["merchant", "dashboard", "seller"],
  },
  {
    pageTypes: ["customer"],
    pathPrefixes: ["/customer"],
    title: "Customer Dashboard",
    summary: "View orders, invoices, wallet, purchases, profile, and marketplace activity.",
    keywords: ["customer", "account", "buyer"],
  },
  {
    pageTypes: ["admin"],
    pathPrefixes: ["/admin"],
    title: "Admin Dashboard",
    summary: "Platform operations restricted to authorized Nexar Network treasury administrators.",
    keywords: ["admin", "cms", "operations"],
  },
  {
    pageTypes: ["market"],
    pathPrefixes: ["/market", "/presale"],
    title: "NXR Market",
    summary: "NXR token market and presale information on Nexar Network.",
    keywords: ["market", "presale", "buy nxr"],
  },
  {
    pageTypes: ["legal"],
    pathPrefixes: ["/privacy", "/terms", "/disclaimer"],
    title: "Legal",
    summary: "Privacy Policy, Terms of Service, and platform disclaimer for Nexar Network.",
    keywords: ["privacy", "terms", "legal"],
  },
  {
    pageTypes: ["contact"],
    pathPrefixes: ["/contact", "/#contact"],
    title: "Contact",
    summary: "Contact Nexar Network and join community channels for support.",
    keywords: ["contact", "support", "help"],
  },
];

export function getPageKnowledge(page: AssistantPageContext): PageKnowledgeEntry | null {
  return (
    PAGE_KNOWLEDGE.find((entry) => entry.pageTypes.includes(page.pageType)) ??
    PAGE_KNOWLEDGE.find((entry) =>
      entry.pathPrefixes.some((prefix) => {
        if (prefix === "/") return page.pageType === "home";
        return page.pageType !== "home";
      }),
    ) ??
    null
  );
}

export function getSectionKnowledge(
  page: AssistantPageContext,
): { title: string; summary: string } | null {
  const entry = getPageKnowledge(page);
  if (!entry?.sections?.length) return null;
  if (page.sectionId) {
    return entry.sections.find((s) => s.id === page.sectionId) ?? null;
  }
  return null;
}

export function summarizeCurrentPage(page: AssistantPageContext): string {
  if (page.pageType === "product" && page.entityName) {
    const parts = [`Product: ${page.entityName}`];
    if (page.entityDescription) parts.push(page.entityDescription.slice(0, 200));
    if (page.entityMeta?.store) parts.push(`Sold by ${page.entityMeta.store}`);
    if (page.entityMeta?.price) parts.push(`Price: ${page.entityMeta.price}`);
    return parts.join(". ");
  }

  const section = getSectionKnowledge(page);
  if (section) return `${section.title}: ${section.summary}`;

  const entry = getPageKnowledge(page);
  if (entry) return `${entry.title}: ${entry.summary}`;

  return `${page.label}: You are browsing ${page.label} on Nexar Network.`;
}
