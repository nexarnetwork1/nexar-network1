import { createClient } from "@/lib/supabase/server";
import type { Cart, CartItemWithProduct } from "@/types";

export async function getOrCreateCart(customerId: string): Promise<Cart | null> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("carts")
    .select("*")
    .eq("customer_id", customerId)
    .single();

  if (existing) return existing as Cart;

  const { data, error } = await supabase
    .from("carts")
    .insert({ customer_id: customerId })
    .select("*")
    .single();

  if (error) return null;
  return data as Cart;
}

export async function getCartWithItems(
  customerId: string
): Promise<{ cart: Cart | null; items: CartItemWithProduct[] }> {
  const supabase = await createClient();

  const cart = await getOrCreateCart(customerId);
  if (!cart) return { cart: null, items: [] };

  const { data, error } = await supabase
    .from("cart_items")
    .select(
      "*, product:products(*, store:stores(id, name, slug, logo_url))"
    )
    .eq("cart_id", cart.id)
    .order("created_at", { ascending: true });

  if (error) return { cart, items: [] };

  return { cart, items: (data ?? []) as CartItemWithProduct[] };
}

export async function getCartItemCount(customerId: string): Promise<number> {
  const supabase = await createClient();

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("customer_id", customerId)
    .single();

  if (!cart) return 0;

  const { count, error } = await supabase
    .from("cart_items")
    .select("*", { count: "exact", head: true })
    .eq("cart_id", cart.id);

  if (error) return 0;
  return count ?? 0;
}
