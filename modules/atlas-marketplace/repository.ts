import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type {
  EnsureStorefrontInput,
  EnrichedMarketplaceListing,
  MarketplaceAdvertisement,
  MarketplaceCheckout,
  MarketplaceCollection,
  MarketplaceListing,
  MarketplaceOffer,
  MarketplaceShipment,
  MarketplaceStorefront,
  PublishListingInput,
} from "./types";

function db() {
  return createAdminClient();
}

export async function getStorefrontByBusinessId(
  businessId: string,
): Promise<MarketplaceStorefront | null> {
  const { data } = await db()
    .from("atlas_marketplace_storefronts")
    .select("*")
    .eq("business_id", businessId)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as MarketplaceStorefront | null) ?? null;
}

export async function getStorefrontById(
  storefrontId: string,
): Promise<MarketplaceStorefront | null> {
  const { data } = await db()
    .from("atlas_marketplace_storefronts")
    .select("*")
    .eq("id", storefrontId)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as MarketplaceStorefront | null) ?? null;
}

export async function getStorefrontBySlug(
  slug: string,
): Promise<MarketplaceStorefront | null> {
  const { data } = await db()
    .from("atlas_marketplace_storefronts")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as MarketplaceStorefront | null) ?? null;
}

export async function ensureBusinessStorefront(
  input: EnsureStorefrontInput,
): Promise<MarketplaceStorefront> {
  let storefront = await getStorefrontByBusinessId(input.businessId);
  if (storefront) {
    if (!storefront.store_id && input.storeId) {
      const { data } = await db()
        .from("atlas_marketplace_storefronts")
        .update({ store_id: input.storeId, updated_at: new Date().toISOString() })
        .eq("id", storefront.id)
        .select("*")
        .single();
      if (data) storefront = data as MarketplaceStorefront;
    }
    return storefront;
  }

  let storeId = input.storeId ?? null;
  if (!storeId) {
    const { data: store } = await db()
      .from("stores")
      .select("id")
      .eq("business_id", input.businessId)
      .limit(1)
      .maybeSingle();
    storeId = (store as { id: string } | null)?.id ?? null;
  }

  const { data, error } = await db()
    .from("atlas_marketplace_storefronts")
    .insert({
      business_id: input.businessId,
      store_id: storeId,
      slug: `${input.slug}-shop`,
      display_name: input.displayName,
      tagline: "Official storefront on ATLAS Marketplace",
      metadata: { source: "ensureBusinessStorefront" },
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create storefront");
  return data as MarketplaceStorefront;
}

export async function getListingById(
  listingId: string,
): Promise<MarketplaceListing | null> {
  const { data } = await db()
    .from("atlas_marketplace_listings")
    .select("*")
    .eq("id", listingId)
    .is("deleted_at", null)
    .maybeSingle();
  return (data as MarketplaceListing | null) ?? null;
}

export async function getListingByProductId(
  productId: string,
): Promise<MarketplaceListing | null> {
  const { data } = await db()
    .from("atlas_marketplace_listings")
    .select("*")
    .eq("product_id", productId)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  return (data as MarketplaceListing | null) ?? null;
}

export async function listPublishedListings(input: {
  storefrontId?: string;
  businessId?: string;
  limit?: number;
}): Promise<MarketplaceListing[]> {
  let q = db()
    .from("atlas_marketplace_listings")
    .select("*")
    .eq("status", "published")
    .is("deleted_at", null)
    .order("published_at", { ascending: false })
    .limit(input.limit ?? 50);
  if (input.storefrontId) q = q.eq("storefront_id", input.storefrontId);
  if (input.businessId) q = q.eq("business_id", input.businessId);
  const { data } = await q;
  return (data as MarketplaceListing[]) ?? [];
}

export async function createOrUpdateListing(
  input: PublishListingInput & { status?: string },
): Promise<MarketplaceListing> {
  if (input.productId) {
    const existing = await getListingByProductId(input.productId);
    if (existing) {
      const { data, error } = await db()
        .from("atlas_marketplace_listings")
        .update({
          title: input.title,
          summary: input.summary ?? null,
          price: input.price ?? null,
          currency: input.currency ?? "USD",
          selling_type: input.sellingType,
          status: input.status ?? "published",
          category_id: input.categoryId ?? null,
          brand_id: input.brandId ?? null,
          published_at:
            (input.status ?? "published") === "published"
              ? new Date().toISOString()
              : existing.published_at,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      if (error || !data) throw new Error(error?.message ?? "Failed to update listing");
      return data as MarketplaceListing;
    }
  }

  const { data, error } = await db()
    .from("atlas_marketplace_listings")
    .insert({
      storefront_id: input.storefrontId,
      business_id: input.businessId,
      product_id: input.productId ?? null,
      selling_type: input.sellingType,
      status: input.status ?? "published",
      title: input.title,
      slug: input.slug,
      summary: input.summary ?? null,
      price: input.price ?? null,
      currency: input.currency ?? "USD",
      category_id: input.categoryId ?? null,
      brand_id: input.brandId ?? null,
      published_at:
        (input.status ?? "published") === "published"
          ? new Date().toISOString()
          : null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create listing");

  await db()
    .from("atlas_marketplace_storefronts")
    .update({
      listing_count: (
        await getStorefrontById(input.storefrontId)
      )!.listing_count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.storefrontId);

  return data as MarketplaceListing;
}

/** Join listing rows with commerce `products` slugs/images for correct marketplace URLs. */
export async function enrichListingsWithProducts(
  listings: MarketplaceListing[],
): Promise<EnrichedMarketplaceListing[]> {
  const productIds = listings
    .map((l) => l.product_id)
    .filter((id): id is string => Boolean(id));
  if (productIds.length === 0) return listings;

  const { data } = await db()
    .from("products")
    .select("id, slug, image_url")
    .in("id", productIds);

  const byId = new Map(
    ((data ?? []) as Array<{ id: string; slug: string | null; image_url: string | null }>).map(
      (p) => [p.id, p],
    ),
  );

  return listings.map((listing) => {
    const product = listing.product_id ? byId.get(listing.product_id) : undefined;
    return {
      ...listing,
      product_slug: product?.slug ?? null,
      product_image_url: product?.image_url ?? null,
    };
  });
}

export async function searchStorefronts(input: {
  query: string;
  limit?: number;
}): Promise<MarketplaceStorefront[]> {
  const q = input.query.trim();
  if (!q) return [];
  const { data } = await db()
    .from("atlas_marketplace_storefronts")
    .select("*")
    .eq("is_published", true)
    .is("deleted_at", null)
    .or(`display_name.ilike.%${q}%,slug.ilike.%${q}%,tagline.ilike.%${q}%`)
    .limit(input.limit ?? 20);
  return (data as MarketplaceStorefront[]) ?? [];
}

export async function searchListings(input: {
  query: string;
  storefrontId?: string;
  businessId?: string;
  sellingType?: string;
  limit?: number;
}): Promise<MarketplaceListing[]> {
  let q = db()
    .from("atlas_marketplace_listings")
    .select("*")
    .eq("status", "published")
    .is("deleted_at", null)
    .or(`title.ilike.%${input.query}%,summary.ilike.%${input.query}%`)
    .limit(input.limit ?? 20);
  if (input.storefrontId) q = q.eq("storefront_id", input.storefrontId);
  if (input.businessId) q = q.eq("business_id", input.businessId);
  if (input.sellingType) q = q.eq("selling_type", input.sellingType);
  const { data } = await q;
  return (data as MarketplaceListing[]) ?? [];
}

export async function createOfferRecord(input: {
  storefrontId: string;
  listingId?: string;
  title: string;
  discountPercent?: number;
  discountAmount?: number;
  startsAt?: string;
  endsAt?: string;
}): Promise<MarketplaceOffer> {
  const { data, error } = await db()
    .from("atlas_marketplace_offers")
    .insert({
      storefront_id: input.storefrontId,
      listing_id: input.listingId ?? null,
      title: input.title,
      discount_percent: input.discountPercent ?? null,
      discount_amount: input.discountAmount ?? null,
      starts_at: input.startsAt ?? new Date().toISOString(),
      ends_at: input.endsAt ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create offer");
  return data as MarketplaceOffer;
}

export async function createCollectionRecord(input: {
  storefrontId: string;
  businessId: string;
  name: string;
  slug: string;
  description?: string;
}): Promise<MarketplaceCollection> {
  const { data, error } = await db()
    .from("atlas_marketplace_collections")
    .insert({
      storefront_id: input.storefrontId,
      business_id: input.businessId,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create collection");
  return data as MarketplaceCollection;
}

export async function createCheckoutRecord(input: {
  buyerUserId: string;
  storefrontId?: string;
  businessId?: string;
  cartId?: string;
  paymentMethod?: string;
  couponCode?: string;
  subtotal?: number;
  discountTotal?: number;
  total?: number;
  currency?: string;
}): Promise<MarketplaceCheckout> {
  const { data, error } = await db()
    .from("atlas_marketplace_checkouts")
    .insert({
      buyer_user_id: input.buyerUserId,
      storefront_id: input.storefrontId ?? null,
      business_id: input.businessId ?? null,
      cart_id: input.cartId ?? null,
      payment_method: input.paymentMethod ?? null,
      coupon_code: input.couponCode ?? null,
      subtotal: input.subtotal ?? null,
      discount_total: input.discountTotal ?? 0,
      total: input.total ?? null,
      currency: input.currency ?? "USD",
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create checkout");
  return data as MarketplaceCheckout;
}

export async function completeCheckoutRecord(
  checkoutId: string,
  orderId: string,
): Promise<MarketplaceCheckout> {
  const { data, error } = await db()
    .from("atlas_marketplace_checkouts")
    .update({
      status: "completed",
      order_id: orderId,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", checkoutId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to complete checkout");
  return data as MarketplaceCheckout;
}

export async function createShipmentRecord(input: {
  orderId: string;
  businessId?: string;
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
}): Promise<MarketplaceShipment> {
  const { data, error } = await db()
    .from("atlas_marketplace_shipments")
    .insert({
      order_id: input.orderId,
      business_id: input.businessId ?? null,
      carrier: input.carrier ?? null,
      tracking_number: input.trackingNumber ?? null,
      tracking_url: input.trackingUrl ?? null,
      status: "pending",
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create shipment");
  return data as MarketplaceShipment;
}

export async function updateShipmentStatus(
  shipmentId: string,
  status: string,
  timestamps?: { shippedAt?: string; deliveredAt?: string },
): Promise<MarketplaceShipment> {
  const patch: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };
  if (timestamps?.shippedAt) patch.shipped_at = timestamps.shippedAt;
  if (timestamps?.deliveredAt) patch.delivered_at = timestamps.deliveredAt;
  const { data, error } = await db()
    .from("atlas_marketplace_shipments")
    .update(patch)
    .eq("id", shipmentId)
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to update shipment");
  return data as MarketplaceShipment;
}

export async function addFavorite(input: {
  userId: string;
  listingId: string;
}): Promise<void> {
  await db().from("atlas_marketplace_favorites").upsert(
    { user_id: input.userId, listing_id: input.listingId },
    { onConflict: "user_id,listing_id" },
  );
}

export async function createAdvertisementRecord(input: {
  businessId: string;
  title: string;
  placement: string;
  listingId?: string;
  storefrontId?: string;
  budget?: number;
  endsAt?: string;
}): Promise<MarketplaceAdvertisement> {
  const { data, error } = await db()
    .from("atlas_marketplace_advertisements")
    .insert({
      business_id: input.businessId,
      title: input.title,
      placement: input.placement,
      listing_id: input.listingId ?? null,
      storefront_id: input.storefrontId ?? null,
      budget: input.budget ?? null,
      ends_at: input.endsAt ?? null,
    })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Failed to create advertisement");
  return data as MarketplaceAdvertisement;
}

export async function recordMonetization(input: {
  kind: string;
  amount: number;
  businessId?: string;
  storefrontId?: string;
  listingId?: string;
  orderId?: string;
  currency?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await db().from("atlas_marketplace_monetization_ledger").insert({
    kind: input.kind,
    amount: input.amount,
    business_id: input.businessId ?? null,
    storefront_id: input.storefrontId ?? null,
    listing_id: input.listingId ?? null,
    order_id: input.orderId ?? null,
    currency: input.currency ?? "USD",
    metadata: input.metadata ?? {},
  });
}

export async function recordAiAction(input: {
  action: string;
  businessId?: string;
  listingId?: string;
  createdBy?: string;
  inputPayload?: Record<string, unknown>;
  output?: Record<string, unknown>;
}): Promise<void> {
  await db().from("atlas_marketplace_ai_actions").insert({
    action: input.action,
    business_id: input.businessId ?? null,
    listing_id: input.listingId ?? null,
    created_by: input.createdBy ?? null,
    input: input.inputPayload ?? {},
    output: input.output ?? {},
  });
}

export async function ensureListingForProduct(input: {
  productId: string;
  businessId: string;
  storeId?: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  isActive: boolean;
}): Promise<MarketplaceListing | null> {
  let storefront = await getStorefrontByBusinessId(input.businessId);
  if (!storefront && input.storeId) {
    const { data: biz } = await db()
      .from("businesses")
      .select("id, display_name, slug, owner_user_id")
      .eq("id", input.businessId)
      .maybeSingle();
    if (biz) {
      const b = biz as {
        id: string;
        display_name: string;
        slug: string;
        owner_user_id: string;
      };
      storefront = await ensureBusinessStorefront({
        businessId: b.id,
        ownerUserId: b.owner_user_id,
        displayName: b.display_name,
        slug: b.slug,
        storeId: input.storeId,
      });
    }
  }
  if (!storefront) return null;

  const base = input.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = `${base || "product"}-${input.productId.slice(0, 8)}`;

  return createOrUpdateListing({
    storefrontId: storefront.id,
    businessId: input.businessId,
    productId: input.productId,
    sellingType: "physical",
    title: input.name,
    slug,
    summary: input.description?.slice(0, 500) ?? undefined,
    price: input.price,
    currency: input.currency,
    actorUserId: storefront.business_id,
    status: input.isActive ? "published" : "draft",
  });
}
