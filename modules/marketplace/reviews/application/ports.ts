export interface ReviewsRepository {
  listPendingProductReviews(limit?: number): Promise<unknown[]>;
  listPendingStoreReviews(limit?: number): Promise<unknown[]>;
}
