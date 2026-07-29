export interface StorefrontRepository {
  listFeaturedStores(limit?: number): Promise<unknown[]>;
  getStoreBySlug(slug: string): Promise<unknown | null>;
}
