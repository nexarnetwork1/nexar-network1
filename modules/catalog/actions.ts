"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { productSchema, productCategorySchema, updateCategorySchema } from "./validators";
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

async function syncProductCatalogData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  stock: number,
  imageUrl: string | null
): Promise<void> {
  await supabase.from("inventory").upsert(
    {
      product_id: productId,
      quantity_on_hand: stock,
      reserved_quantity: 0,
    },
    { onConflict: "product_id" }
  );

  if (!imageUrl) return;

  await supabase
    .from("product_images")
    .update({ is_primary: false })
    .eq("product_id", productId);

  const { data: existing } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", productId)
    .eq("url", imageUrl)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("product_images")
      .update({ is_primary: true })
      .eq("id", existing.id);
  } else {
    await supabase.from("product_images").insert({
      product_id: productId,
      url: imageUrl,
      is_primary: true,
      sort_order: 0,
    });
  }
}

function slugifyCategory(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function createCategoryAction(
  formData: FormData
): Promise<CatalogActionResult> {
  const profile = await requireRole(["merchant"]);
  const store = await getMerchantStore(profile.id);

  if (!store) {
    return { success: false, error: "Store not found" };
  }

  const parsed = productCategorySchema.safeParse({
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const baseSlug = slugifyCategory(parsed.data.name);
  const supabase = await createClient();

  let slug = baseSlug;
  let suffix = 0;
  while (true) {
    const { data: existing } = await supabase
      .from("product_categories")
      .select("id")
      .eq("store_id", store.id)
      .eq("slug", slug)
      .maybeSingle();

    if (!existing) break;
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const { error } = await supabase.from("product_categories").insert({
    store_id: store.id,
    name: parsed.data.name,
    slug,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/merchant/categories");
  revalidatePath("/merchant/products/new");
  return { success: true, redirectTo: "/merchant/categories" };
}

export async function updateCategoryAction(
  categoryId: string,
  formData: FormData
): Promise<CatalogActionResult> {
  const profile = await requireRole(["merchant"]);
  const store = await getMerchantStore(profile.id);

  if (!store) {
    return { success: false, error: "Store not found" };
  }

  const parsed = updateCategorySchema.safeParse({
    categoryId,
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const baseSlug = slugifyCategory(parsed.data.name);
  const supabase = await createClient();

  const { error } = await supabase
    .from("product_categories")
    .update({ name: parsed.data.name, slug: baseSlug })
    .eq("id", categoryId)
    .eq("store_id", store.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/merchant/categories");
  revalidatePath("/merchant/products");
  return { success: true };
}

export async function deleteCategoryAction(
  categoryId: string
): Promise<CatalogActionResult> {
  const profile = await requireRole(["merchant"]);
  const store = await getMerchantStore(profile.id);

  if (!store) {
    return { success: false, error: "Store not found" };
  }

  const supabase = await createClient();

  await supabase
    .from("products")
    .update({ category_id: null })
    .eq("category_id", categoryId)
    .eq("store_id", store.id);

  const { error } = await supabase
    .from("product_categories")
    .delete()
    .eq("id", categoryId)
    .eq("store_id", store.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/merchant/categories");
  revalidatePath("/merchant/products");
  return { success: true };
}

export async function updateCategoryFormAction(formData: FormData): Promise<void> {
  const categoryId = formData.get("categoryId");
  if (typeof categoryId !== "string" || !categoryId) return;
  await updateCategoryAction(categoryId, formData);
}

export async function deleteCategoryFormAction(formData: FormData): Promise<void> {
  const categoryId = formData.get("categoryId");
  if (typeof categoryId !== "string" || !categoryId) return;
  await deleteCategoryAction(categoryId);
}

export async function createProductAction(
  formData: FormData
): Promise<CatalogActionResult> {
  const profile = await requireRole(["merchant"]);
  const store = await getMerchantStore(profile.id);

  if (!store) {
    return { success: false, error: "Store not found" };
  }

  if (store.mode === "payments_only") {
    return { success: false, error: "Payments-only stores cannot manage products" };
  }

  const parsed = productSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    price: formData.get("price"),
    compareAtPrice: formData.get("compareAtPrice") || undefined,
    currency: formData.get("currency") || "USD",
    stock: formData.get("stock"),
    isActive: formData.get("isActive") !== "false",
    categoryId: formData.get("categoryId") || undefined,
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
      compare_at_price: parsed.data.compareAtPrice ?? null,
      currency: parsed.data.currency,
      stock: parsed.data.stock,
      is_active: parsed.data.isActive,
      image_url: imageUrl,
      category_id: parsed.data.categoryId || null,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  await syncProductCatalogData(supabase, data.id, parsed.data.stock, imageUrl);

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
    compareAtPrice: formData.get("compareAtPrice") || undefined,
    currency: formData.get("currency") || "USD",
    stock: formData.get("stock"),
    isActive: formData.get("isActive") !== "false",
    categoryId: formData.get("categoryId") || undefined,
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
    compare_at_price: parsed.data.compareAtPrice ?? null,
    currency: parsed.data.currency,
    stock: parsed.data.stock,
    is_active: parsed.data.isActive,
  };

  if (parsed.data.categoryId) {
    updatePayload.category_id = parsed.data.categoryId;
  } else {
    updatePayload.category_id = null;
  }

  if (imageUrl) updatePayload.image_url = imageUrl;

  const { error } = await supabase
    .from("products")
    .update(updatePayload)
    .eq("id", productId)
    .eq("store_id", store.id);

  if (error) {
    return { success: false, error: error.message };
  }

  await syncProductCatalogData(
    supabase,
    productId,
    parsed.data.stock,
    imageUrl ?? null
  );

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

export async function toggleProductFormAction(formData: FormData): Promise<void> {
  const productId = formData.get("productId");
  const isActive = formData.get("isActive") === "true";
  if (typeof productId !== "string" || !productId) return;
  await toggleProductActiveAction(productId, isActive);
}

export async function deleteProductFormAction(formData: FormData): Promise<void> {
  const productId = formData.get("productId");
  if (typeof productId !== "string" || !productId) return;
  await deleteProductAction(productId);
}
