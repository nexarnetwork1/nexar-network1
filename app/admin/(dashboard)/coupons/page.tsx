import { Tag } from "lucide-react";
import { requireSuperAdmin } from "@/modules/users/repository";
import { getPlatformCoupons } from "@/modules/coupons/repository";
import { createCouponFormAction } from "@/modules/coupons/actions";
import { Button } from "@/components/ui/Button";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  dashboardFilterControlClass,
} from "@/components/dashboard";

export default async function AdminCouponsPage() {
  await requireSuperAdmin();
  const coupons = await getPlatformCoupons();

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Platform coupons"
        headingClassName="text-gold"
        description="Global discount codes across the marketplace."
      />

      <DashboardSection level="h3" title="Create a coupon">
        <DashboardCard className="max-w-lg">
          <form action={createCouponFormAction} className="space-y-4">
            <input type="hidden" name="couponScope" value="platform" />

            <div className="space-y-1.5">
              <label htmlFor="coupon-code" className="block text-sm text-muted">
                Code
              </label>
              <input
                id="coupon-code"
                name="code"
                placeholder="NEXAR10"
                required
                className={`${dashboardFilterControlClass} w-full uppercase`}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="coupon-type" className="block text-sm text-muted">
                Discount type
              </label>
              <select
                id="coupon-type"
                name="couponType"
                required
                className={`${dashboardFilterControlClass} w-full`}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="coupon-value" className="block text-sm text-muted">
                Value
              </label>
              <input
                id="coupon-value"
                name="value"
                type="number"
                step="0.01"
                required
                className={`${dashboardFilterControlClass} w-full`}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="coupon-usage-limit" className="block text-sm text-muted">
                Usage limit
              </label>
              <input
                id="coupon-usage-limit"
                name="usageLimit"
                type="number"
                placeholder="Usage limit"
                className={`${dashboardFilterControlClass} w-full`}
              />
            </div>

            <Button type="submit" className="w-full sm:w-auto">
              Create platform coupon
            </Button>
          </form>
        </DashboardCard>
      </DashboardSection>

      <DashboardSection level="h3" title="Active platform coupons">
        {coupons.length === 0 ? (
          <DashboardEmptyState
            icon={<Tag className="h-5 w-5" aria-hidden />}
            title="No platform coupons yet"
            description="Create a global discount code above and it will be listed here."
          />
        ) : (
          <ul className="space-y-3">
            {coupons.map((c) => (
              <DashboardCard as="li" key={c.id}>
                <p className="font-semibold text-gold">{c.code}</p>
                <p className="mt-1 text-sm text-muted">
                  {c.coupon_type} · {c.value} · {c.used_count} used
                </p>
              </DashboardCard>
            ))}
          </ul>
        )}
      </DashboardSection>
    </div>
  );
}
