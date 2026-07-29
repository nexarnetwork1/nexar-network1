"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, requireRole } from "@/modules/users/repository";
import { getWishlistProductIds, trackRecentlyViewed } from "./repository";
import type { ActionResult } from "@/modules/auth/actions";

const WISHLIST_PATHS = [
  "/customer/wishlist",
  "/customer/browse",
  "/marketplace",
  "/marketplace/browse",
];

function revalidateWishlistPaths() {
  for (const path of WISHLIST_PATHS) {
    revalidatePath(path);
  }
}

export async function getWishlistStateAction(): Promise<{
  authenticated: boolean;
  ids: string[];
}> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "customer") {
    return { authenticated: false, ids: [] };
  }

  const ids = await getWishlistProductIds(profile.id);
  return { authenticated: true, ids };
}

export async function syncGuestWishlistAction(guestIds: string[]): Promise<string[]> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "customer" || guestIds.length === 0) {
    return profile && profile.role === "customer"
      ? getWishlistProductIds(profile.id)
      : [];
  }

  const supabase = await createClient();
  const existing = await getWishlistProductIds(profile.id);
  const toAdd = guestIds.filter((id) => !existing.includes(id));

  if (toAdd.length > 0) {
    await supabase.from("wishlist_items").upsert(
      toAdd.map((productId) => ({
        customer_id: profile.id,
        product_id: productId,
      })),
      { onConflict: "customer_id,product_id", ignoreDuplicates: true }
    );
    revalidateWishlistPaths();
  }

  return getWishlistProductIds(profile.id);
}

export async function toggleWishlistAction(productId: string): Promise<ActionResult & { saved?: boolean }> {
  const profile = await requireRole(["customer"]);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("wishlist_items")
    .select("id")
    .eq("customer_id", profile.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    await supabase.from("wishlist_items").delete().eq("id", existing.id);
    revalidateWishlistPaths();
    return { success: true, saved: false };
  }

  const { error } = await supabase.from("wishlist_items").insert({
    customer_id: profile.id,
    product_id: productId,
  });

  if (error) return { success: false, error: error.message };

  revalidateWishlistPaths();
  return { success: true, saved: true };
}

export async function trackProductViewAction(productId: string): Promise<void> {
  const profile = await requireRole(["customer"]);
  await trackRecentlyViewed(profile.id, productId);
}
