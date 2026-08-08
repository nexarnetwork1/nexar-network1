import { createAdminClient } from "@/lib/supabase/admin";
import type { ReviewsRepository } from "../application/ports";

export class SupabaseReviewsRepository implements ReviewsRepository {
  async listPendingProductReviews(limit = 30): Promise<unknown[]> {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("product_reviews")
      .select("*")
      .in("status", ["pending", "flagged"])
      .order("created_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  }

  async listPendingStoreReviews(limit = 30): Promise<unknown[]> {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("store_reviews")
      .select("*")
      .in("status", ["pending", "flagged"])
      .order("created_at", { ascending: false })
      .limit(limit);
    return data ?? [];
  }
}

export const reviewsRepository = new SupabaseReviewsRepository();
