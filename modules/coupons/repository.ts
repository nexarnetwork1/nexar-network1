import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Coupon, CouponScope, CouponType } from "@/types";

export function calculateCouponDiscount(
  coupon: Pick<Coupon, "coupon_type" | "value">,
  orderTotalUsd: number
): number {
  if (coupon.coupon_type === "free_shipping") return 0;
  if (coupon.coupon_type === "percentage") {
    return Number((orderTotalUsd * (coupon.value / 100)).toFixed(2));
  }
  return Math.min(coupon.value, orderTotalUsd);
}

export async function validateCoupon(
  code: string,
  storeId?: string,
  orderTotalUsd = 0
): Promise<{ valid: boolean; coupon?: Coupon; discountUsd?: number; freeShipping?: boolean; error?: string }> {
  const supabase = await createClient();
  let query = supabase
    .from("coupons")
    .select("*")
    .eq("is_active", true)
    .ilike("code", code.trim());

  const { data } = await query.maybeSingle();
  const coupon = data as Coupon | null;

  if (!coupon) return { valid: false, error: "Coupon not found" };
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, error: "Coupon expired" };
  }
  if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
    return { valid: false, error: "Coupon usage limit reached" };
  }
  if (orderTotalUsd < coupon.min_order_usd) {
    return { valid: false, error: `Minimum order $${coupon.min_order_usd} required` };
  }
  if (coupon.coupon_scope === "merchant" && storeId && coupon.store_id !== storeId) {
    return { valid: false, error: "Coupon not valid for this store" };
  }

  return {
    valid: true,
    coupon,
    discountUsd: calculateCouponDiscount(coupon, orderTotalUsd),
    freeShipping: coupon.coupon_type === "free_shipping",
  };
}

export async function getStoreCoupons(storeId: string): Promise<Coupon[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("coupons")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Coupon[];
}

export async function getPlatformCoupons(): Promise<Coupon[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("coupons")
    .select("*")
    .eq("coupon_scope", "platform")
    .order("created_at", { ascending: false });
  return (data ?? []) as Coupon[];
}

export async function createCoupon(params: {
  code: string;
  couponType: CouponType;
  couponScope: CouponScope;
  storeId?: string;
  value: number;
  usageLimit?: number;
  minOrderUsd?: number;
  expiresAt?: string;
  createdBy: string;
}): Promise<{ id?: string; error?: string }> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("coupons")
    .insert({
      code: params.code.toUpperCase(),
      coupon_type: params.couponType,
      coupon_scope: params.couponScope,
      store_id: params.storeId ?? null,
      value: params.value,
      usage_limit: params.usageLimit ?? null,
      min_order_usd: params.minOrderUsd ?? 0,
      expires_at: params.expiresAt ?? null,
      created_by: params.createdBy,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };
  return { id: data.id };
}

export async function redeemCoupon(params: {
  couponId: string;
  orderId: string;
  customerId: string;
  discountUsd: number;
}): Promise<boolean> {
  const admin = createAdminClient();
  const { error: redemptionError } = await admin.from("coupon_redemptions").insert({
    coupon_id: params.couponId,
    order_id: params.orderId,
    customer_id: params.customerId,
    discount_usd: params.discountUsd,
  });
  if (redemptionError) return false;

  const { data: coupon } = await admin
    .from("coupons")
    .select("used_count")
    .eq("id", params.couponId)
    .single();

  await admin
    .from("coupons")
    .update({ used_count: (coupon?.used_count ?? 0) + 1 })
    .eq("id", params.couponId);

  return true;
}
