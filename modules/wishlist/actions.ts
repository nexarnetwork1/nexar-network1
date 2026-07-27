"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/users/repository";
import { trackRecentlyViewed } from "./repository";
import type { ActionResult } from "@/modules/auth/actions";

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
    revalidatePath("/customer/wishlist");
    revalidatePath("/customer/browse");
    return { success: true, saved: false };
  }

  const { error } = await supabase.from("wishlist_items").insert({
    customer_id: profile.id,
    product_id: productId,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/customer/wishlist");
  revalidatePath("/customer/browse");
  return { success: true, saved: true };
}

export async function trackProductViewAction(productId: string): Promise<void> {
  const profile = await requireRole(["customer"]);
  await trackRecentlyViewed(profile.id, productId);
}
