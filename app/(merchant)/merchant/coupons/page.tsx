import { Tag } from "lucide-react";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getStoreCoupons } from "@/modules/coupons/repository";
import { createCouponFormAction } from "@/modules/coupons/actions";
import { Button } from "@/components/ui/Button";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  dashboardFilterControlClass,
} from "@/components/dashboard";

export default async function MerchantCouponsPage() {
  const profile = await getCurrentProfile();
  if (!profile) return null;
  const store = await getMerchantStore(profile.id);
  if (!store) {
    return (
      <DashboardSection as="div" level="h1" title="Coupons" description="No store found." />
    );
  }

  const coupons = await getStoreCoupons(store.id);

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Coupons"
        description={`Create discount codes for ${store.name}.`}
      />

      <DashboardSection title="New coupon" level="h3">
        <DashboardCard className="max-w-lg">
          <form action={createCouponFormAction} className="space-y-4">
            <input type="hidden" name="couponScope" value="merchant" />
            <input type="hidden" name="storeId" value={store.id} />

            <div className="space-y-1.5">
              <label htmlFor="coupon-code" className="block text-sm font-medium text-muted">
                Code
              </label>
              <input
                id="coupon-code"
                name="code"
                placeholder="SUMMER20"
                required
                className={`${dashboardFilterControlClass} w-full uppercase`}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="coupon-type" className="block text-sm font-medium text-muted">
                Discount type
              </label>
              <select
                id="coupon-type"
                name="couponType"
                required
                className={`${dashboardFilterControlClass} w-full`}
              >
                <option value="percentage">Percentage discount</option>
                <option value="fixed">Fixed discount</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="coupon-value" className="block text-sm font-medium text-muted">
                Value (% or USD)
              </label>
              <input
                id="coupon-value"
                name="value"
                type="number"
                step="0.01"
                placeholder="Value (% or USD)"
                required
                className={`${dashboardFilterControlClass} w-full`}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="coupon-usage-limit" className="block text-sm font-medium text-muted">
                Usage limit (optional)
              </label>
              <input
                id="coupon-usage-limit"
                name="usageLimit"
                type="number"
                placeholder="Usage limit (optional)"
                className={`${dashboardFilterControlClass} w-full`}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="coupon-expires-at" className="block text-sm font-medium text-muted">
                Expires at (optional)
              </label>
              <input
                id="coupon-expires-at"
                name="expiresAt"
                type="datetime-local"
                className={`${dashboardFilterControlClass} w-full`}
              />
            </div>

            <Button type="submit" className="w-full sm:w-auto">
              Create coupon
            </Button>
          </form>
        </DashboardCard>
      </DashboardSection>

      <DashboardSection title="Active codes" level="h3">
        {coupons.length === 0 ? (
          <DashboardEmptyState
            icon={<Tag className="h-5 w-5" aria-hidden />}
            title="No coupons yet"
            description="Discount codes you create for this store will be listed here."
          />
        ) : (
          <ul className="space-y-3">
            {coupons.map((c) => (
              <DashboardCard as="li" key={c.id}>
                <p className="break-all font-semibold text-gold">{c.code}</p>
                <p className="mt-1 text-sm text-muted">
                  {c.coupon_type === "percentage" ? `${c.value}%` : `$${c.value}`} · Used{" "}
                  {c.used_count}
                  {c.usage_limit ? ` / ${c.usage_limit}` : ""}
                </p>
              </DashboardCard>
            ))}
          </ul>
        )}
      </DashboardSection>
    </div>
  );
}
