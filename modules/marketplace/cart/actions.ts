"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCatalogProductById } from "@/modules/marketplace/catalog";
import { getOrCreateMarketplaceCart } from "./application/get-or-create-cart";
import { requireRole } from "@/modules/users/repository";
import type { ActionResult } from "@/modules/auth/actions";

const CART_PATHS = ["/marketplace/cart", "/marketplace/checkout"] as const;

function revalidateCart() {
  for (const path of CART_PATHS) revalidatePath(path);
}

export async function addToCartAction(
  productId: string,
  quantity = 1,
): Promise<ActionResult & { cartCount?: number }> {
  let profile;
  try {
    profile = await requireRole(["customer"]);
  } catch {
    return { success: false, error: "Please sign in to add items to your cart." };
  }

  if (quantity < 1 || quantity > 99) {
    return { success: false, error: "Invalid quantity" };
  }

  const product = await getCatalogProductById(productId);
  if (!product || !product.is_active) {
    return { success: false, error: "Product not available" };
  }

  if (product.stock < quantity) {
    return { success: false, error: "Insufficient stock" };
  }

  const cart = await getOrCreateMarketplaceCart(profile.id);
  if (!cart) {
    return { success: false, error: "Could not open cart" };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cart.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const nextQty = Math.min(product.stock, (existing.quantity as number) + quantity);
    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: nextQty })
      .eq("id", existing.id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("cart_items").insert({
      cart_id: cart.id,
      product_id: productId,
      quantity,
    });
    if (error) return { success: false, error: error.message };
  }

  const { count } = await supabase
    .from("cart_items")
    .select("*", { count: "exact", head: true })
    .eq("cart_id", cart.id);

  revalidateCart();
  revalidatePath("/marketplace/products/[handle]", "page");

  return { success: true, cartCount: count ?? 0 };
}

export async function updateCartItemQuantityAction(
  cartItemId: string,
  quantity: number,
): Promise<ActionResult> {
  try {
    await requireRole(["customer"]);
  } catch {
    return { success: false, error: "Please sign in." };
  }

  if (quantity < 1) {
    return removeCartItemAction(cartItemId);
  }

  const supabase = await createClient();
  const { data: line } = await supabase
    .from("cart_items")
    .select("product_id, cart:carts(customer_id)")
    .eq("id", cartItemId)
    .maybeSingle();

  if (!line) return { success: false, error: "Cart item not found" };

  const product = await getCatalogProductById(line.product_id as string);
  if (!product) return { success: false, error: "Product unavailable" };
  if (product.stock < quantity) {
    return { success: false, error: "Insufficient stock" };
  }

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", cartItemId);

  if (error) return { success: false, error: error.message };

  revalidateCart();
  return { success: true };
}

export async function removeCartItemAction(cartItemId: string): Promise<ActionResult> {
  try {
    await requireRole(["customer"]);
  } catch {
    return { success: false, error: "Please sign in." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);

  if (error) return { success: false, error: error.message };

  revalidateCart();
  return { success: true };
}
