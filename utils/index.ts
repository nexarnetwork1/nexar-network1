export { cn } from "@/lib/utils/cn";
export { objectToFormData } from "./form-data";
export { formatDate, formatDateTime, formatRelative } from "./format";
export { groupCartItemsByStore, type CartStoreGroup } from "./cart";
export { toCsv, csvResponse } from "./export/csv";

export function formatCurrency(
  amount: number,
  currency = "USD",
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
