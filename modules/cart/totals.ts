import type { ProductWithStore } from "@/types";

export type CartTotalsLine = {
  quantity: number;
  product: Pick<ProductWithStore, "price" | "currency">;
};

export type CartAdjustmentType = "coupon" | "shipping" | "tax";

export type CartAdjustment = {
  type: CartAdjustmentType;
  label: string;
  amount: number;
  applied: boolean;
  note?: string;
};

export type CartTotalsInput = {
  couponCode?: string | null;
  couponDiscount?: number;
  shippingAmount?: number;
  shippingMethod?: string | null;
  taxAmount?: number;
  taxRegion?: string | null;
};

export type CartTotals = {
  subtotal: number;
  couponDiscount: number;
  shipping: number;
  tax: number;
  grandTotal: number;
  currency: string;
  adjustments: CartAdjustment[];
};

export function calculateCartTotals(
  items: CartTotalsLine[],
  options: CartTotalsInput = {}
): CartTotals {
  const currency = items[0]?.product.currency ?? "USD";
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  const couponDiscount = Math.min(options.couponDiscount ?? 0, subtotal);
  const shipping = options.shippingAmount ?? 0;
  const tax = options.taxAmount ?? 0;
  const afterDiscount = Math.max(0, subtotal - couponDiscount);
  const grandTotal = afterDiscount + shipping + tax;

  const adjustments: CartAdjustment[] = [
    {
      type: "coupon",
      label: options.couponCode ? `Coupon (${options.couponCode})` : "Discounts / coupons",
      amount: couponDiscount,
      applied: couponDiscount > 0,
      note: couponDiscount > 0 ? undefined : "Enter code at checkout",
    },
    {
      type: "shipping",
      label: options.shippingMethod
        ? `Shipping (${options.shippingMethod})`
        : "Shipping",
      amount: shipping,
      applied: shipping > 0,
      note: shipping > 0 ? undefined : "Calculated at checkout",
    },
    {
      type: "tax",
      label: options.taxRegion ? `Tax (${options.taxRegion})` : "Tax",
      amount: tax,
      applied: tax > 0,
      note: tax > 0 ? undefined : "Calculated at checkout",
    },
  ];

  return {
    subtotal,
    couponDiscount,
    shipping,
    tax,
    grandTotal,
    currency,
    adjustments,
  };
}
