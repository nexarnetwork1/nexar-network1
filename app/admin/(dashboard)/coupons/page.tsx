import { requireSuperAdmin } from "@/modules/users/repository";
import { getPlatformCoupons } from "@/modules/coupons/repository";
import { createCouponFormAction } from "@/modules/coupons/actions";
import { Button } from "@/components/ui/Button";

export default async function AdminCouponsPage() {
  await requireSuperAdmin();
  const coupons = await getPlatformCoupons();

  return (
    <div>
      <h1 className="text-3xl font-bold text-white">Platform Coupons</h1>
      <p className="mt-2 text-muted">Global discount codes across the marketplace.</p>

      <form action={createCouponFormAction} className="mt-8 max-w-lg space-y-4 rounded-xl border border-border p-6">
        <input type="hidden" name="couponScope" value="platform" />
        <input name="code" placeholder="NEXAR10" required className="w-full rounded-lg border border-border bg-surface px-3 py-2 uppercase" />
        <select name="couponType" required className="w-full rounded-lg border border-border bg-surface px-3 py-2">
          <option value="percentage">Percentage</option>
          <option value="fixed">Fixed</option>
        </select>
        <input name="value" type="number" step="0.01" required className="w-full rounded-lg border border-border bg-surface px-3 py-2" />
        <input name="usageLimit" type="number" placeholder="Usage limit" className="w-full rounded-lg border border-border bg-surface px-3 py-2" />
        <Button type="submit">Create platform coupon</Button>
      </form>

      <div className="mt-8 space-y-3">
        {coupons.map((c) => (
          <div key={c.id} className="rounded-xl border border-border p-4">
            <p className="font-semibold text-yellow-400">{c.code}</p>
            <p className="text-sm text-zinc-400">
              {c.coupon_type} · {c.value} · {c.used_count} used
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
