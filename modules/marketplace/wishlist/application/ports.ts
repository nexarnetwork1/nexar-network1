export interface WishlistRepository {
  listProductIds(customerId: string): Promise<string[]>;
  addProduct(customerId: string, productId: string): Promise<void>;
  removeProduct(customerId: string, productId: string): Promise<void>;
}
