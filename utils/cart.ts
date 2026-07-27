import type { CartItemWithProduct } from "@/types";

export type CartStoreGroup = {
  storeId: string;
  storeName: string;
  items: CartItemWithProduct[];
  subtotal: number;
};

export function groupCartItemsByStore(
  items: CartItemWithProduct[]
): CartStoreGroup[] {
  const map = new Map<string, CartStoreGroup>();

  for (const item of items) {
    const storeId = item.product.store_id;
    const existing = map.get(storeId);

    if (existing) {
      existing.items.push(item);
      existing.subtotal += Number(item.product.price) * item.quantity;
    } else {
      map.set(storeId, {
        storeId,
        storeName: item.product.store.name,
        items: [item],
        subtotal: Number(item.product.price) * item.quantity,
      });
    }
  }

  return Array.from(map.values());
}
