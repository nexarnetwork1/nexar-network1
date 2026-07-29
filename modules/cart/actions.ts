"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProfile, requireRole } from "@/modules/users/repository";
import { getMarketplaceProduct } from "@/modules/catalog/repository";
import { getOrCreateCart, getCartWithItems } from "./repository";
import { addToCartSchema, updateCartItemSchema, type CartLine } from "./validators";
import { validateCoupon } from "@/modules/coupons/repository";
import type { ActionResult } from "@/modules/auth/actions";
import type { ProductWithStore } from "@/types";

const CART_PATHS = [
  "/customer/cart",
  "/customer/browse",
  "/marketplace",
  "/marketplace/browse",
  "/marketplace/cart",
];

function revalidateCartPaths() {
  for (const path of CART_PATHS) {
    revalidatePath(path);
  }
}

async function mergeProductIntoCart(
  customerId: string,
  productId: string,
  quantity: number
): Promise<ActionResult> {
  const product = await getMarketplaceProduct(productId);
  if (!product) {
    return { success: false, error: "Product not available" };
  }

  if (product.stock < quantity) {
    return { success: false, error: "Insufficient stock" };
  }

  const cart = await getOrCreateCart(customerId);
  if (!cart) {
    return { success: false, error: "Could not create cart" };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cart.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const newQty = existing.quantity + quantity;
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
      product_id: productId,
      quantity,
    });

    if (error) return { success: false, error: error.message };
  }

  return { success: true };
}

export async function addProductToCustomerCart(
  customerId: string,
  productId: string,
  quantity = 1
): Promise<ActionResult> {
  const result = await mergeProductIntoCart(customerId, productId, quantity);
  if (result.success) revalidateCartPaths();
  return result;
}

export async function getCartStateAction(): Promise<{
  authenticated: boolean;
  items: CartLine[];
}> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "customer") {
    return { authenticated: false, items: [] };
  }

  const { items } = await getCartWithItems(profile.id);
  return {
    authenticated: true,
    items: items.map((item) => ({
      productId: item.product_id,
      quantity: item.quantity,
    })),
  };
}

export async function syncGuestCartAction(guestItems: CartLine[]): Promise<CartLine[]> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "customer" || guestItems.length === 0) {
    return profile && profile.role === "customer"
      ? (await getCartStateAction()).items
      : [];
  }

  for (const line of guestItems) {
    await mergeProductIntoCart(profile.id, line.productId, line.quantity);
  }

  revalidateCartPaths();
  return (await getCartStateAction()).items;
}

export async function resolveCartProductsAction(
  lines: CartLine[]
): Promise<Array<CartLine & { product: ProductWithStore }>> {
  if (lines.length === 0) return [];

  const supabase = await createClient();
  const productIds = lines.map((line) => line.productId);

  const { data, error } = await supabase
    .from("products")
    .select(
      "*, store:stores!inner(id, name, slug, logo_url, status, mode), images:product_images(url, is_primary, sort_order)"
    )
    .in("id", productIds)
    .eq("is_active", true)
    .eq("store.status", "active")
    .eq("store.mode", "marketplace");

  if (error || !data?.length) return [];

  const products = data.map((row) => {
    const { images, ...product } = row as ProductWithStore & {
      images?: { url: string; is_primary: boolean; sort_order: number }[];
    };
    const primary = images?.find((image) => image.is_primary);
    const image_url = primary?.url ?? images?.[0]?.url ?? product.image_url;
    return { ...product, image_url } as ProductWithStore;
  });

  const byId = new Map(products.map((product) => [product.id, product]));

  return lines
    .map((line) => {
      const product = byId.get(line.productId);
      return product ? { ...line, product } : null;
    })
    .filter(Boolean) as Array<CartLine & { product: ProductWithStore }>;
}

export async function addToCartAction(formData: FormData): Promise<ActionResult> {
  const profile = await requireRole(["customer"]);

  const parsed = addToCartSchema.safeParse({
    productId: formData.get("productId"),
    quantity: formData.get("quantity") ?? 1,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const result = await mergeProductIntoCart(
    profile.id,
    parsed.data.productId,
    parsed.data.quantity
  );

  if (!result.success) return result;

  revalidateCartPaths();
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

  revalidateCartPaths();
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

  revalidateCartPaths();
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

  revalidateCartPaths();
  return { success: true };
}

export async function validateCartCouponAction(
  code: string,
  orderTotalUsd: number
): Promise<ActionResult & { discountUsd?: number; message?: string }> {
  await requireRole(["customer"]);
  const result = await validateCoupon(code, undefined, orderTotalUsd);
  if (!result.valid) {
    return { success: false, error: result.error ?? "Invalid coupon" };
  }
  return {
    success: true,
    discountUsd: result.discountUsd,
    message: `Saved $${result.discountUsd?.toFixed(2)} (preview — applied at checkout)`,
  };
}
