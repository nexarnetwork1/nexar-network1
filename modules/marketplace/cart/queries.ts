import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getOrCreateMarketplaceCart } from "./application/get-or-create-cart";

export async function getMarketplaceCartItemCount(customerId: string): Promise<number> {
  const cart = await getOrCreateMarketplaceCart(customerId);
  if (!cart) return 0;

  const supabase = await createClient();
  const { count } = await supabase
    .from("cart_items")
    .select("*", { count: "exact", head: true })
    .eq("cart_id", cart.id);

  return count ?? 0;
}
