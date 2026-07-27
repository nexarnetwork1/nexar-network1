"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/users/repository";
import { getMarketplaceProduct } from "@/modules/catalog/repository";
import { getOrCreateCart, getCartWithItems } from "./repository";
import { addToCartSchema, updateCartItemSchema } from "./validators";
import type { ActionResult } from "@/modules/auth/actions";

export async function addToCartAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireRole(["customer"]);

  const parsed = addToCartSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity") ?? 1,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const product = await getMarketplaceProduct(parsed.data.productId);
  if (!product) {
    return { success: false, error: "Product not available" };
  }

  if (product.stock < parsed.data.quantity) {
    return { success: false, error: "Insufficient stock" };
  }

  const cart = await getOrCreateCart(profile.id);
  if (!cart) {
    return { success: false, error: "Could not create cart" };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cart.id)
    .eq("product_id", parsed.data.productId)
    .single();

  if (existing) {
    const newQty = existing.quantity + parsed.data.quantity;
    if (newQty > product.stock) {
      return { success: false, error: "Insufficient stock" };
    }

    const { error } = await supabase
      .from("cart_items")
      .update({ quantity: newQty })
      .eq("id", existing.id);

    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await supabase.from("cart_items").insert({
      cart_id: cart.id,
      product_id: parsed.data.productId,
      quantity: parsed.data.quantity,
    });

    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/customer/cart");
  revalidatePath("/customer/browse");
  return { success: true };
}

export async function updateCartItemAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireRole(["customer"]);

  const parsed = updateCartItemSchema.safeParse({
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { items } = await getCartWithItems(profile.id);
  const cartItem = items.find((i) => i.id === parsed.data.itemId);

  if (!cartItem) {
    return { success: false, error: "Cart item not found" };
  }

  const product = await getMarketplaceProduct(cartItem.product_id);
  if (!product || product.stock < parsed.data.quantity) {
    return { success: false, error: "Insufficient stock" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("cart_items")
    .update({ quantity: parsed.data.quantity })
    .eq("id", cartItem.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/customer/cart");
  return { success: true };
}

export async function removeCartItemAction(itemId: string): Promise<ActionResult> {
  const profile = await requireRole(["customer"]);
  const { items } = await getCartWithItems(profile.id);
  const cartItem = items.find((i) => i.id === itemId);

  if (!cartItem) {
    return { success: false, error: "Cart item not found" };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("cart_items").delete().eq("id", itemId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/customer/cart");
  return { success: true };
}

export async function clearCartAction(): Promise<ActionResult> {
  const profile = await requireRole(["customer"]);
  const cart = await getOrCreateCart(profile.id);

  if (!cart) return { success: true };

  const supabase = await createClient();
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("cart_id", cart.id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/customer/cart");
  return { success: true };
}
