/**
 * ATLAS Network domain event subscribers.
 * Wire cross-module reactions without importing module internals.
 */

import { onDomainEvent } from "@/domains/events/bus";

let registered = false;

/** Register network reactions to platform events (call once at app bootstrap). */
export function registerAtlasNetworkEventHandlers(): void {
  if (registered) return;
  registered = true;

  onDomainEvent("business.created", async (event) => {
    const businessId = event.businessId;
    if (!businessId || !event.actorId) return;
    try {
      const { ensureCompanyNetworkProfile } = await import("./service");
      const payload = event.payload as {
        slug?: string;
        storeId?: string;
        legalName?: string;
        displayName?: string;
      };
      await ensureCompanyNetworkProfile({
        businessId,
        ownerUserId: event.actorId,
        displayName: payload.displayName ?? "Business",
        legalName: payload.legalName ?? payload.displayName ?? "Business",
        slug: payload.slug ?? businessId.slice(0, 8),
      });
    } catch {
      // Non-fatal — DB trigger may have already provisioned the profile.
    }
  });

  onDomainEvent("store.created", async (event) => {
    const businessId = event.businessId;
    if (!businessId) return;
    try {
      const { recordBusinessActivity } = await import("./service");
      await recordBusinessActivity({
        activityType: "store_created",
        businessId,
        actorUserId: event.actorId,
        payload: event.payload,
      });
    } catch {
      /* non-fatal */
    }
  });

  onDomainEvent("product.created", async (event) => {
    const businessId = event.businessId;
    if (!businessId) return;
    try {
      const { recordBusinessActivity } = await import("./service");
      await recordBusinessActivity({
        activityType: "product_created",
        businessId,
        actorUserId: event.actorId,
        payload: event.payload,
      });
    } catch {
      /* non-fatal */
    }
  });

  onDomainEvent("product.published", async (event) => {
    const businessId = event.businessId;
    if (!businessId) return;
    try {
      const productId = String(event.payload.productId ?? event.payload.id ?? "");
      if (!productId) return;

      const { getListingByProductId, enrichListingsWithProducts } = await import(
        "@/modules/atlas-marketplace/repository"
      );
      const { publishProductNetworkPost } = await import("./service");

      let listing = await getListingByProductId(productId);
      if (listing) {
        [listing] = await enrichListingsWithProducts([listing]);
      }

      await publishProductNetworkPost({
        businessId,
        actorUserId: event.actorId,
        productId,
        listingId: listing?.id ?? null,
        productSlug:
          (listing as { product_slug?: string | null } | undefined)?.product_slug ??
          (typeof event.payload.slug === "string" ? event.payload.slug : null),
        title: String(event.payload.name ?? event.payload.title ?? listing?.title ?? "Product"),
        summary:
          typeof event.payload.description === "string"
            ? event.payload.description.slice(0, 500)
            : listing?.summary,
        price: Number(event.payload.price ?? listing?.price ?? 0) || null,
        currency: String(event.payload.currency ?? listing?.currency ?? "USD"),
        imageUrl:
          (listing as { product_image_url?: string | null } | undefined)?.product_image_url ??
          (typeof event.payload.imageUrl === "string" ? event.payload.imageUrl : null),
      });
    } catch {
      /* non-fatal */
    }
  });
}
