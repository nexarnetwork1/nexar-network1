export interface RecommendationsRepository {
  relatedProductIds(productId: string, limit?: number): Promise<string[]>;
}
