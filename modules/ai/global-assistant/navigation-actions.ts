import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";
import type { AssistantAction, AssistantUserRole } from "./types";

type ActionDef = AssistantAction & {
  roles?: AssistantUserRole[];
  keywords?: string[];
};

/** Contextual navigation and prompt actions catalog. */
export const NAVIGATION_ACTIONS: ActionDef[] = [
  { label: "Open Marketplace", href: MARKETPLACE_ROUTES.root, keywords: ["marketplace", "shop"] },
  { label: "Open Shop", href: MARKETPLACE_ROUTES.shop, keywords: ["shop", "products"] },
  { label: "Go to Cart", href: MARKETPLACE_ROUTES.cart, roles: ["customer"], keywords: ["cart"] },
  { label: "Open Wishlist", href: MARKETPLACE_ROUTES.wishlist, roles: ["customer"], keywords: ["wishlist"] },
  { label: "Open Checkout", href: MARKETPLACE_ROUTES.checkout, roles: ["customer"], keywords: ["checkout"] },
  { label: "Open Orders", href: "/customer/orders", roles: ["customer"], keywords: ["orders"] },
  { label: "Customer Dashboard", href: "/customer", roles: ["customer"], keywords: ["customer"] },
  { label: "Open Wallet", href: "/customer/wallet", roles: ["customer"], keywords: ["wallet"] },
  {
    label: "Become a Merchant",
    href: `${MARKETPLACE_ROUTES.root}?auth=register&role=merchant`,
    roles: ["guest", "customer"],
    keywords: ["merchant", "sell", "register"],
  },
  {
    label: "Register Merchant",
    href: `${MARKETPLACE_ROUTES.root}?auth=register&role=merchant`,
    roles: ["guest", "customer"],
    keywords: ["register merchant"],
  },
  { label: "Merchant Dashboard", href: "/merchant", roles: ["merchant"], keywords: ["merchant dashboard"] },
  { label: "Add Product", href: "/merchant/products/new", roles: ["merchant"], keywords: ["add product", "publish"] },
  { label: "Merchant Products", href: "/merchant/products", roles: ["merchant"], keywords: ["products"] },
  { label: "Merchant Orders", href: "/merchant/orders", roles: ["merchant"], keywords: ["orders"] },
  { label: "Store Settings", href: "/merchant/store", roles: ["merchant"], keywords: ["store"] },
  { label: "Admin Dashboard", href: "/admin/dashboard", roles: ["treasury_admin", "admin"], keywords: ["admin"] },
  { label: "Open Whitepaper", href: "/whitepaper", keywords: ["whitepaper", "paper"] },
  { label: "Tokenomics", href: "/whitepaper#tokenomics", keywords: ["tokenomics"] },
  { label: "Roadmap", href: "/#roadmap", keywords: ["roadmap"] },
  { label: "Open About", href: "/#about", keywords: ["about"] },
  { label: "Open Founder", href: "/#founder", keywords: ["founder"] },
  { label: "Open Contact", href: "/#contact", keywords: ["contact"] },
  { label: "Open FAQ", href: `${MARKETPLACE_ROUTES.root}#faq`, keywords: ["faq"] },
  { label: "NXR Market", href: "/market", keywords: ["nxr", "buy nxr", "market"] },
  { label: "Sign In", href: `${MARKETPLACE_ROUTES.root}?auth=signin`, roles: ["guest"], keywords: ["sign in", "login"] },
  { label: "Privacy Policy", href: "/privacy", keywords: ["privacy"] },
  { label: "Terms of Service", href: "/terms", keywords: ["terms"] },
];

export function filterActionsForRole(
  role: AssistantUserRole,
  limit = 6,
): AssistantAction[] {
  return NAVIGATION_ACTIONS.filter(
    (action) => !action.roles || action.roles.includes(role),
  )
    .slice(0, limit)
    .map(({ label, href, kind, prompt }) => ({ label, href, kind, prompt }));
}

export function pickActionsForTopic(
  topic: string,
  role: AssistantUserRole,
  limit = 4,
): AssistantAction[] {
  const normalized = topic.toLowerCase();
  const scored = NAVIGATION_ACTIONS.filter(
    (action) => !action.roles || action.roles.includes(role),
  )
    .map((action) => {
      let score = 0;
      if (normalized.includes(action.label.toLowerCase())) score += 5;
      for (const kw of action.keywords ?? []) {
        if (normalized.includes(kw)) score += 3;
      }
      return { action, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  const picked = scored.slice(0, limit).map(({ action }) => action);
  if (picked.length >= 2) {
    return picked.map(({ label, href, kind, prompt }) => ({ label, href, kind, prompt }));
  }

  return filterActionsForRole(role, limit);
}

export function pickActionsForPage(
  pageType: string,
  role: AssistantUserRole,
): AssistantAction[] {
  const byPage: Record<string, string[]> = {
    product: ["Open Shop", "Go to Cart", "Open Marketplace"],
    cart: ["Open Checkout", "Open Shop", "Open Marketplace"],
    checkout: ["Open Cart", "Open Orders", "Open Marketplace"],
    merchant: ["Add Product", "Merchant Orders", "Store Settings"],
    customer: ["Open Orders", "Open Marketplace", "Open Wallet"],
    admin: ["Admin Dashboard", "Open Marketplace"],
    whitepaper: ["Tokenomics", "Roadmap", "Open Marketplace"],
  };

  const labels = byPage[pageType] ?? ["Open Marketplace", "Open Whitepaper", "Open FAQ"];
  return labels
    .map((label) => NAVIGATION_ACTIONS.find((a) => a.label === label))
    .filter((action): action is ActionDef => Boolean(action))
    .filter((a) => !a.roles || a.roles.includes(role))
    .map(({ label, href, kind, prompt }) => ({ label, href, kind, prompt }));
}
