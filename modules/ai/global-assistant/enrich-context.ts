import { getSuperAdminSession } from "@/lib/admin/super-admin";
import { getCurrentProfile } from "@/modules/users/repository";
import { getProductDetail } from "@/modules/marketplace/storefront/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { summarizeCurrentPage } from "../site-knowledge/page-index";
import {
  buildEnrichedContext,
  parseRouteContext,
  resolveUserRole,
} from "./context";
import type {
  EnrichedAssistantContext,
  GlobalAssistantRequestContext,
} from "./types";

/** Server-side context enrichment: role, entity data, page summaries. */
export async function enrichAssistantContext(
  request: GlobalAssistantRequestContext,
): Promise<EnrichedAssistantContext> {
  const pathname = request.pathname ?? "/";
  const page = parseRouteContext(pathname, request.hash);

  const [profile, adminSession] = await Promise.all([
    getCurrentProfile().catch(() => null),
    getSuperAdminSession().catch(() => null),
  ]);

  const userRole = resolveUserRole(profile?.role, Boolean(adminSession), pathname);

  if (page.pageType === "product" && page.entitySlug) {
    try {
      const product = await getProductDetail(page.entitySlug, profile?.id ?? undefined);
      if (product) {
        page.entityId = product.id;
        page.entityName = product.name;
        page.entityDescription = product.description ?? undefined;
        page.entityMeta = {
          store: product.store.name,
          price: `${product.price} ${product.currency}`,
          category: product.marketplace_category_name ?? "",
        };
        page.label = product.name;
      }
    } catch {
      // Product context optional — fall back to slug-only
    }
  }

  if (page.pageType === "merchant" && profile?.role === "merchant") {
    try {
      const store = await getMerchantStore(profile.id);
      if (store) {
        page.entityId = store.id;
        page.entityName = store.name;
        page.entityMeta = { status: store.status, mode: store.mode };
      }
    } catch {
      // optional
    }
  }

  const enriched = buildEnrichedContext(request, { userRole, page });
  enriched.page = page;

  return enriched;
}

export function getContextSummary(context: EnrichedAssistantContext): string {
  const pageSummary = summarizeCurrentPage(context.page);
  const roleLabel =
    context.userRole === "guest"
      ? "Guest"
      : context.userRole === "treasury_admin"
        ? "Treasury Admin"
        : context.userRole.charAt(0).toUpperCase() + context.userRole.slice(1);

  return `Context: ${roleLabel} on ${context.page.label} (${context.pathname}). ${pageSummary}`;
}
