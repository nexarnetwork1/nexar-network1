"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { productSchema } from "./validators";
import type { ActionResult } from "@/modules/auth/actions";

export type CatalogActionResult = ActionResult & {
  productId?: string;
};

async function uploadProductImage(
  userId: string,
  file: File
): Promise<string | null> {
  const supabase = await createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { upsert: true });

  if (error) return null;

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

export async function createProductAction(
  formData: FormData
): Promise<CatalogActionResult> {
  const profile = await requireRole(["merchant"]);
  const store = await getMerchantStore(profile.id);

  if (!store) {
    return { success: false, error: "Store not found" };
  }

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    currency: formData.get("currency") || "USD",
    stock: formData.get("stock"),
    isActive: formData.get("isActive") !== "false",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let imageUrl: string | null = null;
  const imageFile = formData.get("image") as File | null;
  if (imageFile && imageFile.size > 0) {
    imageUrl = await uploadProductImage(profile.id, imageFile);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert({
      store_id: store.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      price: parsed.data.price,
      currency: parsed.data.currency,
      stock: parsed.data.stock,
      is_active: parsed.data.isActive,
      image_url: imageUrl,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/merchant/products");
  return { success: true, productId: data.id, redirectTo: "/merchant/products" };
}

export async function updateProductAction(
  productId: string,
  formData: FormData
): Promise<CatalogActionResult> {
  const profile = await requireRole(["merchant"]);
  const store = await getMerchantStore(profile.id);

  if (!store) {
    return { success: false, error: "Store not found" };
  }

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    currency: formData.get("currency") || "USD",
    stock: formData.get("stock"),
    isActive: formData.get("isActive") !== "false",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let imageUrl: string | undefined;
  const imageFile = formData.get("image") as File | null;
  if (imageFile && imageFile.size > 0) {
    const uploaded = await uploadProductImage(profile.id, imageFile);
    if (uploaded) imageUrl = uploaded;
  }

  const supabase = await createClient();
  const updatePayload: Record<string, unknown> = {
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    price: parsed.data.price,
    currency: parsed.data.currency,
    stock: parsed.data.stock,
    is_active: parsed.data.isActive,
  };

  if (imageUrl) updatePayload.image_url = imageUrl;

  const { error } = await supabase
    .from("products")
    .update(updatePayload)
    .eq("id", productId)
    .eq("store_id", store.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/merchant/products");
  revalidatePath(`/merchant/products/${productId}/edit`);
  return { success: true, redirectTo: "/merchant/products" };
}

export async function deleteProductAction(
  productId: string
): Promise<CatalogActionResult> {
  const profile = await requireRole(["merchant"]);
  const store = await getMerchantStore(profile.id);

  if (!store) {
    return { success: false, error: "Store not found" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("store_id", store.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/merchant/products");
  return { success: true, redirectTo: "/merchant/products" };
}

export async function toggleProductActiveAction(
  productId: string,
  isActive: boolean
): Promise<CatalogActionResult> {
  const profile = await requireRole(["merchant"]);
  const store = await getMerchantStore(profile.id);

  if (!store) {
    return { success: false, error: "Store not found" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive })
    .eq("id", productId)
    .eq("store_id", store.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/merchant/products");
  return { success: true };
}
