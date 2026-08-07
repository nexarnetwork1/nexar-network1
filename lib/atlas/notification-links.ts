import { MARKETPLACE_ROUTES } from "@/modules/marketplace/shared/constants";

/**
 * Resolve in-app navigation for ATLAS notification metadata.
 * Reused by `/atlas/notifications` and future notification surfaces.
 */
export function resolveAtlasNotificationHref(
  metadata: Record<string, unknown>,
): string | null {
  const event = typeof metadata.event === "string" ? metadata.event : null;

  const postId = str(metadata, "postId");
  const eventId = str(metadata, "eventId");
  const profileId = str(metadata, "profileId");
  const profileSlug = str(metadata, "profileSlug") ?? str(metadata, "slug");
  const businessId = str(metadata, "businessId");
  const businessSlug = str(metadata, "companySlug");
  const conversationId = str(metadata, "conversationId");
  const orderId = str(metadata, "order_id") ?? str(metadata, "orderId");
  const invoiceId = str(metadata, "invoice_id") ?? str(metadata, "invoiceId");
  const productSlug = str(metadata, "productSlug");
  const storeSlug = str(metadata, "storeSlug");
  const listingId = str(metadata, "listingId");

  if (event?.startsWith("network.job") && postId) {
    return `/atlas/jobs/${postId}`;
  }
  if (event?.startsWith("network.event") && eventId) {
    return `/atlas/events/${eventId}`;
  }
  if (event === "job.published" && postId) {
    return `/atlas/jobs/${postId}`;
  }

  if (postId) {
    const postType = str(metadata, "postType");
    if (postType === "job") return `/atlas/jobs/${postId}`;
    if (postType === "event" && eventId) return `/atlas/events/${eventId}`;
    return `/atlas#post-${postId}`;
  }

  if (eventId) return `/atlas/events/${eventId}`;

  if (conversationId) {
    return `/atlas/messages?conversation=${conversationId}`;
  }

  if (profileSlug) return `/atlas/network/${profileSlug}`;
  if (profileId) return `/atlas/profile`;

  if (businessSlug) return `/atlas/network/${businessSlug}`;
  if (businessId) return `/atlas/business`;

  if (productSlug) return MARKETPLACE_ROUTES.product(productSlug);
  if (storeSlug) return MARKETPLACE_ROUTES.store(storeSlug);
  if (listingId) return `${MARKETPLACE_ROUTES.root}?listing=${listingId}`;

  if (orderId) return `/dashboard/marketplace/orders/${orderId}`;
  if (invoiceId) return `/dashboard/business/invoices/${invoiceId}`;

  if (event === "business.verification_approved") {
    return "/dashboard/business/profile";
  }
  if (event === "product.published") {
    return productSlug ? MARKETPLACE_ROUTES.product(productSlug) : "/dashboard/business/products";
  }
  if (event === "order.paid" || event === "payment.confirmed") {
    return orderId ? `/dashboard/marketplace/orders/${orderId}` : "/dashboard/finance/wallet";
  }
  if (event === "invoice.issued") {
    return invoiceId ? `/dashboard/business/invoices/${invoiceId}` : "/dashboard/business/invoices";
  }
  if (event === "nxr.reward_granted") {
    return "/dashboard/nxr";
  }
  if (event?.startsWith("network.")) {
    return "/atlas/notifications";
  }

  return null;
}

function str(metadata: Record<string, unknown>, key: string): string | null {
  const value = metadata[key];
  return typeof value === "string" && value.length > 0 ? value : null;
}
