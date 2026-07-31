import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { WishlistRepository } from "../application/ports";

export class SupabaseWishlistRepository implements WishlistRepository {
  async listProductIds(customerId: string): Promise<string[]> {
    const supabase = await createClient();
    const { data } = await supabase
      .from("wishlist_items")
      .select("product_id")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    return (data ?? []).map((row) => row.product_id as string);
  }

  async addProduct(customerId: string, productId: string): Promise<void> {
    const supabase = await createClient();
    await supabase
      .from("wishlist_items")
      .upsert({ customer_id: customerId, product_id: productId });
  }

  async removeProduct(customerId: string, productId: string): Promise<void> {
    const supabase = await createClient();
    await supabase
      .from("wishlist_items")
      .delete()
      .eq("customer_id", customerId)
      .eq("product_id", productId);
  }
}

export const wishlistRepository = new SupabaseWishlistRepository();
