import { createClient } from "@/lib/supabase/server";
import { marketplaceConfig } from "../../shared/config";
import type { CatalogRepository } from "../application/ports";
import type {
  CatalogListParams,
  CatalogListResult,
  CatalogProductDetail,
} from "../../shared/types";

export class SupabaseCatalogRepository implements CatalogRepository {
  async listProducts(params: CatalogListParams): Promise<CatalogListResult> {
    const supabase = await createClient();
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(
      params.limit ?? marketplaceConfig.defaultPageSize,
      marketplaceConfig.maxPageSize
    );
    const offset = (page - 1) * limit;

    let query = supabase
      .from("products")
      .select(
        "*, store:stores!inner(id, name, slug, logo_url, status, mode)",
        { count: "exact" }
      )
      .eq("is_active", true)
      .eq("store.status", "active")
      .eq("store.mode", "marketplace");

    if (params.storeSlug) {
      query = query.eq("store.slug", params.storeSlug);
    }

    if (params.query?.trim()) {
      query = query.ilike("name", `%${params.query.trim()}%`);
    }

    switch (params.sort) {
      case "price_asc":
        query = query.order("price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false });
        break;
      case "name":
        query = query.order("name", { ascending: true });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);
    if (error) {
      return { items: [], total: 0, page, limit };
    }

    return {
      items: (data ?? []) as CatalogListResult["items"],
      total: count ?? 0,
      page,
      limit,
    };
  }

  async getProductByHandle(handle: string): Promise<CatalogProductDetail | null> {
    // Product handles (slug column) will be added in a future migration.
    // Until then, treat handle as product id for API compatibility.
    return this.getProductById(handle);
  }

  async getProductById(id: string): Promise<CatalogProductDetail | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, store:stores!inner(id, name, slug, logo_url, status, mode)")
      .eq("id", id)
      .eq("is_active", true)
      .eq("store.status", "active")
      .eq("store.mode", "marketplace")
      .maybeSingle();

    if (error || !data) return null;
    return data as CatalogProductDetail;
  }
}

export const catalogRepository = new SupabaseCatalogRepository();
