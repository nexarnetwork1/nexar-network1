import { createClient } from "@/lib/supabase/server";
import type { Cart, CartItemWithProduct } from "@/types";
import type { CartRepository } from "../application/ports";
import type { CartSnapshot } from "../../shared/types";

export class SupabaseCartRepository implements CartRepository {
  async getOrCreateCart(customerId: string): Promise<Cart | null> {
    const supabase = await createClient();

    const { data: existing } = await supabase
      .from("carts")
      .select("*")
      .eq("customer_id", customerId)
      .maybeSingle();

    if (existing) return existing as Cart;

    const { data, error } = await supabase
      .from("carts")
      .insert({ customer_id: customerId })
      .select("*")
      .single();

    if (error) return null;
    return data as Cart;
  }

  async getCartSnapshot(customerId: string): Promise<CartSnapshot | null> {
    const supabase = await createClient();
    const cart = await this.getOrCreateCart(customerId);
    if (!cart) return null;

    const { data: lines } = await supabase
      .from("cart_items")
      .select("product_id, quantity")
      .eq("cart_id", cart.id);

    return {
      id: cart.id,
      customerId,
      lines: (lines ?? []).map((line) => ({
        productId: line.product_id as string,
        quantity: line.quantity as number,
      })),
      updatedAt: cart.updated_at,
    };
  }

  async getCartWithItems(
    customerId: string
  ): Promise<{ cart: Cart | null; items: CartItemWithProduct[] }> {
    const supabase = await createClient();
    const cart = await this.getOrCreateCart(customerId);
    if (!cart) return { cart: null, items: [] };

    const { data, error } = await supabase
      .from("cart_items")
      .select("*, product:products(*, store:stores(id, name, slug, logo_url))")
      .eq("cart_id", cart.id)
      .order("created_at", { ascending: true });

    if (error) return { cart, items: [] };
    return { cart, items: (data ?? []) as CartItemWithProduct[] };
  }
}

export const cartRepository = new SupabaseCartRepository();
