import type { Cart, CartItemWithProduct } from "@/types";
import type { CartSnapshot } from "../../shared/types";

export interface CartRepository {
  getOrCreateCart(customerId: string): Promise<Cart | null>;
  getCartSnapshot(customerId: string): Promise<CartSnapshot | null>;
  getCartWithItems(
    customerId: string
  ): Promise<{ cart: Cart | null; items: CartItemWithProduct[] }>;
}
