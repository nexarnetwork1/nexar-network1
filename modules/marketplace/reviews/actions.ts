"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireSuperAdmin } from "@/modules/users/repository";
import type { ActionResult } from "@/modules/auth/actions";

const moderateSchema = z.object({
  reviewId: z.string().uuid(),
  status: z.enum(["approved", "rejected", "hidden", "flagged"]),
  type: z.enum(["product", "store"]),
});

export async function moderateReviewAction(formData: FormData): Promise<ActionResult> {
  await requireSuperAdmin();

  const parsed = moderateSchema.safeParse({
    reviewId: formData.get("reviewId"),
    status: formData.get("status"),
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const table = parsed.data.type === "product" ? "product_reviews" : "store_reviews";
  const supabase = createAdminClient();
  const { error } = await supabase
    .from(table)
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.reviewId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/reviews");
  revalidatePath("/marketplace");
  return { success: true };
}

export async function listRecentProductReviews(limit = 50) {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("product_reviews")
    .select("id, rating, title, body, status, created_at, product:products(name, slug), customer:profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function listRecentStoreReviews(limit = 50) {
  await requireSuperAdmin();
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("store_reviews")
    .select("id, rating, title, body, status, created_at, store:stores(name, slug), customer:profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}
