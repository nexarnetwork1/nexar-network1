import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import type {
  AssistantPageContext,
  AssistantPageType,
  AssistantUserRole,
  ConversationTurn,
  EnrichedAssistantContext,
  GlobalAssistantRequestContext,
} from "./types";

const PAGE_LABELS: Record<AssistantPageType, string> = {
  home: "Home",
  marketplace: "Marketplace",
  product: "Product page",
  shop: "Marketplace Shop",
  cart: "Shopping Cart",
  checkout: "Checkout",
  wishlist: "Wishlist",
  merchant: "Merchant Dashboard",
  customer: "Customer Dashboard",
  admin: "Admin Dashboard",
  whitepaper: "Whitepaper",
  about: "About",
  legal: "Legal",
  market: "NXR Market",
  atlas: "ATLAS",
  pay: "Payment",
  contact: "Contact",
  other: "Nexar Network",
};

export function parseRouteContext(pathname: string, hash?: string): AssistantPageContext {
  const path = pathname.split("?")[0] || "/";
  const hashId = hash?.replace(/^#/, "") || undefined;

  if (path === "/") {
    return { pageType: "home", label: PAGE_LABELS.home, sectionId: hashId };
  }

  const productMatch = path.match(/^\/marketplace\/products\/([^/]+)$/);
  if (productMatch) {
    return {
      pageType: "product",
      label: PAGE_LABELS.product,
      entitySlug: decodeURIComponent(productMatch[1]),
    };
  }

  if (path.startsWith(MARKETPLACE_ROUTES.checkout)) {
    return { pageType: "checkout", label: PAGE_LABELS.checkout };
  }
  if (path.startsWith(MARKETPLACE_ROUTES.cart)) {
    return { pageType: "cart", label: PAGE_LABELS.cart };
  }
  if (path.startsWith(MARKETPLACE_ROUTES.wishlist)) {
    return { pageType: "wishlist", label: PAGE_LABELS.wishlist };
  }
  if (path.startsWith(MARKETPLACE_ROUTES.shop)) {
    return { pageType: "shop", label: PAGE_LABELS.shop };
  }
  if (path.startsWith(MARKETPLACE_ROUTES.root)) {
    return { pageType: "marketplace", label: PAGE_LABELS.marketplace, sectionId: hashId };
  }

  if (path.startsWith("/merchant")) {
    const sub = path.replace("/merchant", "").replace(/^\//, "") || "overview";
    return {
      pageType: "merchant",
      label: sub === "overview" ? PAGE_LABELS.merchant : `Merchant · ${sub.replace(/\//g, " › ")}`,
    };
  }

  if (path.startsWith("/customer")) {
    const sub = path.replace("/customer", "").replace(/^\//, "") || "overview";
    return {
      pageType: "customer",
      label: sub === "overview" ? PAGE_LABELS.customer : `Customer · ${sub.replace(/\//g, " › ")}`,
    };
  }

  if (path.startsWith("/admin")) {
    const sub = path.replace("/admin", "").replace(/^\//, "") || "login";
    return {
      pageType: "admin",
      label: sub === "login" ? "Admin Login" : `Admin · ${sub.replace(/\//g, " › ")}`,
    };
  }

  if (path.startsWith("/whitepaper")) {
    return { pageType: "whitepaper", label: PAGE_LABELS.whitepaper, sectionId: hashId };
  }
  if (path.startsWith("/about")) {
    return { pageType: "about", label: PAGE_LABELS.about };
  }
  if (path.startsWith("/market") || path.startsWith("/presale")) {
    return { pageType: "market", label: PAGE_LABELS.market };
  }
  if (path.startsWith("/atlas")) {
    const sub = path.replace("/atlas", "").replace(/^\//, "") || "home";
    return {
      pageType: "atlas",
      label: sub === "home" ? PAGE_LABELS.atlas : `ATLAS · ${sub.replace(/\//g, " › ")}`,
    };
  }
  if (path.startsWith("/pay")) {
    return { pageType: "pay", label: PAGE_LABELS.pay };
  }
  if (path.startsWith("/privacy") || path.startsWith("/terms") || path.startsWith("/disclaimer")) {
    return { pageType: "legal", label: PAGE_LABELS.legal };
  }
  if (path.startsWith("/contact")) {
    return { pageType: "contact", label: PAGE_LABELS.contact };
  }

  return { pageType: "other", label: PAGE_LABELS.other };
}

export function resolveUserRole(
  profileRole?: string | null,
  isTreasuryAdmin?: boolean,
  pathname?: string,
): AssistantUserRole {
  if (isTreasuryAdmin) return "treasury_admin";
  if (profileRole === "merchant") return "merchant";
  if (profileRole === "customer") return "customer";
  if (profileRole === "admin") return "admin";
  if (pathname?.startsWith("/admin")) return "guest";
  return "guest";
}

export function extractConversationMemory(history: ConversationTurn[]): {
  lastTopic?: string;
  lastEntity?: EnrichedAssistantContext["lastEntity"];
} {
  const assistants = [...history].reverse().filter((t) => t.role === "assistant");
  const lastAssistant = assistants[0];
  const lastTopic = lastAssistant?.topic;

  for (let i = history.length - 1; i >= 0; i -= 1) {
    const turn = history[i];
    if (turn.entityRef) {
      const [type, name] = turn.entityRef.split("::");
      if (type && name) return { lastTopic, lastEntity: { type, name } };
    }
  }

  return { lastTopic };
}

export function buildEnrichedContext(
  request: GlobalAssistantRequestContext,
  extras: {
    userRole: AssistantUserRole;
    page: AssistantPageContext;
  },
): EnrichedAssistantContext {
  const history = request.conversationHistory ?? [];
  const memory = extractConversationMemory(history);

  return {
    pathname: request.pathname ?? "/",
    hash: request.hash,
    userRole: extras.userRole,
    page: extras.page,
    conversationHistory: history.slice(-12),
    ...memory,
  };
}
