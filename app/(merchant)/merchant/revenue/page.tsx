import { redirect } from "next/navigation";
import { Coins } from "lucide-react";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getMerchantOrders } from "@/modules/orders/repository";
import { getMerchantProfile } from "@/modules/wallet/repository";
import { createClient } from "@/lib/supabase/server";
import { UsdAmount } from "@/components/payments/CurrencyAmount";
import {
  DashboardCard,
  DashboardEmptyState,
  DashboardSection,
  DashboardStat,
  DashboardStats,
} from "@/components/dashboard";

export default async function MerchantRevenuePage() {
  const profile = await getCurrentProfile();
  if (!profile) {
  redirect("/login?redirect=/merchant/revenue");
}

  const store = await getMerchantStore(profile.id);
  if (!store) redirect("/merchant");

  const [orders, merchantProfile] = await Promise.all([
    getMerchantOrders(store.id),
    getMerchantProfile(profile.id),
  ]);
  const paidOrders = orders.filter((o) => o.status === "paid");

  const supabase = await createClient();
  const { data: settlements } = await supabase
    .from("settlements")
    .select("*")
    .in(
      "order_id",
      paidOrders.length > 0 ? paidOrders.map((o) => o.id) : ["00000000-0000-0000-0000-000000000000"]
    );

  const totalGross = paidOrders.reduce((sum, o) => sum + Number(o.subtotal), 0);
  const totalFees = (settlements ?? []).reduce(
    (sum, s) => sum + Number(s.platform_fee),
    0
  );
  const totalNet =
    merchantProfile?.total_revenue_usd ??
    (settlements ?? []).reduce((sum, s) => sum + Number(s.merchant_amount), 0);

  return (
    <div className="space-y-8">
      <DashboardSection
        as="div"
        level="h1"
        title="Revenue"
        description={`${store.name} — earnings overview`}
      />

      <DashboardStats columns={3}>
        <DashboardStat label="Gross sales" value={<UsdAmount amount={totalGross} size={20} />} />
        <DashboardStat label="Platform fees" value={<UsdAmount amount={totalFees} size={20} />} />
        <DashboardStat
          label="Net received"
          tone="gold"
          value={<UsdAmount amount={totalNet} size={20} />}
        />
      </DashboardStats>

      <DashboardSection title="Payout wallet" level="h3">
        <DashboardCard>
          <p className="break-all font-mono text-sm">{store.wallet_address}</p>
        </DashboardCard>
      </DashboardSection>

      <DashboardSection title="Recent paid orders" level="h3">
        {paidOrders.length === 0 ? (
          <DashboardEmptyState
            icon={<Coins className="h-5 w-5" aria-hidden />}
            title="No paid orders yet"
            description="Settled orders will show up here as soon as customers pay."
          />
        ) : (
          <ul className="space-y-2">
            {paidOrders.slice(0, 10).map((order) => (
              <DashboardCard
                as="li"
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <span className="break-all font-mono text-xs">{order.id.slice(0, 8)}…</span>
                <UsdAmount amount={Number(order.subtotal)} size={16} />
              </DashboardCard>
            ))}
          </ul>
        )}
      </DashboardSection>
    </div>
  );
}
