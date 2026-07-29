import type { Cart } from "@/types";
import { cartRepository } from "../infrastructure/supabase-cart-repository";

export async function getOrCreateMarketplaceCart(
  customerId: string
): Promise<Cart | null> {
  return cartRepository.getOrCreateCart(customerId);
}

export async function getMarketplaceCartWithItems(customerId: string) {
  return cartRepository.getCartWithItems(customerId);
}
