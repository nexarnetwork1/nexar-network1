import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getStoreCoupons } from "@/modules/coupons/repository";
import { createCouponFormAction } from "@/modules/coupons/actions";
import { Button } from "@/components/ui/Button";

export default async function MerchantCouponsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const store = await getMerchantStore(profile.id);
  if (!store) return <p className="text-muted">No store found.</p>;

  const coupons = await getStoreCoupons(store.id);

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Coupons</h1>
      <p className="mt-2 text-muted">Create discount codes for {store.name}.</p>

      <form action={createCouponFormAction} className="mt-8 max-w-lg space-y-4 rounded-xl border border-border p-6">
        <input type="hidden" name="couponScope" value="merchant" />
        <input type="hidden" name="storeId" value={store.id} />
        <input name="code" placeholder="SUMMER20" required className="w-full rounded-lg border border-border bg-surface px-3 py-2 uppercase" />
        <select name="couponType" required className="w-full rounded-lg border border-border bg-surface px-3 py-2">
          <option value="percentage">Percentage discount</option>
          <option value="fixed">Fixed discount</option>
        </select>
        <input name="value" type="number" step="0.01" placeholder="Value (% or USD)" required className="w-full rounded-lg border border-border bg-surface px-3 py-2" />
        <input name="usageLimit" type="number" placeholder="Usage limit (optional)" className="w-full rounded-lg border border-border bg-surface px-3 py-2" />
        <input name="expiresAt" type="datetime-local" className="w-full rounded-lg border border-border bg-surface px-3 py-2" />
        <Button type="submit">Create coupon</Button>
      </form>

      <div className="mt-8 space-y-3">
        {coupons.map((c) => (
          <div key={c.id} className="rounded-xl border border-border p-4">
            <p className="font-semibold text-gold">{c.code}</p>
            <p className="text-sm text-muted">
              {c.coupon_type === "percentage" ? `${c.value}%` : `$${c.value}`} · Used {c.used_count}
              {c.usage_limit ? ` / ${c.usage_limit}` : ""}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
