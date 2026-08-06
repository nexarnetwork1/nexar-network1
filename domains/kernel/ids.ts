/**
 * NBOS Shared Kernel — identity primitives.
 * Every aggregate ID is a UUID string. Never invent parallel ID types per module.
 */

export type UUID = string & { readonly __brand: "UUID" };

export type UserId = UUID & { readonly __entity: "User" };
export type BusinessId = UUID & { readonly __entity: "Business" };
export type StoreId = UUID & { readonly __entity: "Store" };
export type ProductId = UUID & { readonly __entity: "Product" };
export type OrderId = UUID & { readonly __entity: "Order" };
export type PaymentId = UUID & { readonly __entity: "Payment" };
export type WalletId = UUID & { readonly __entity: "Wallet" };
export type DocumentId = UUID & { readonly __entity: "Document" };
export type EmployeeId = UUID & { readonly __entity: "Employee" };
export type PartnerId = UUID & { readonly __entity: "Partner" };
export type NotificationId = UUID & { readonly __entity: "Notification" };
export type MediaAssetId = UUID & { readonly __entity: "MediaAsset" };
export type NetworkProfileId = UUID & { readonly __entity: "NetworkProfile" };
export type NetworkPostId = UUID & { readonly __entity: "NetworkPost" };
export type NetworkPageId = UUID & { readonly __entity: "NetworkPage" };

/** Runtime cast helpers — validate format at boundaries only. */
export function asUUID(value: string): UUID {
  return value as UUID;
}

export function asUserId(value: string): UserId {
  return value as UserId;
}

export function asBusinessId(value: string): BusinessId {
  return value as BusinessId;
}
