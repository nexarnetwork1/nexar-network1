import type { CartItemWithProduct, ProductWithStore } from "@/types";
import type { CartLine } from "@/modules/cart/validators";

export type CartStoreGroup = {
  storeId: string;
  storeName: string;
  items: CartItemWithProduct[];
  subtotal: number;
};

export type GuestCartLine = CartLine & { product: ProductWithStore };

export type GuestCartStoreGroup = {
  storeId: string;
  storeName: string;
  items: GuestCartLine[];
  subtotal: number;
};

function buildStoreGroups<T extends { quantity: number; product: ProductWithStore }>(
  items: T[]
): Array<{ storeId: string; storeName: string; items: T[]; subtotal: number }> {
  const map = new Map<string, { storeId: string; storeName: string; items: T[]; subtotal: number }>();

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

export function groupCartItemsByStore(items: CartItemWithProduct[]): CartStoreGroup[] {
  return buildStoreGroups(items);
}

export function groupGuestCartLinesByStore(lines: GuestCartLine[]): GuestCartStoreGroup[] {
  return buildStoreGroups(lines);
}
