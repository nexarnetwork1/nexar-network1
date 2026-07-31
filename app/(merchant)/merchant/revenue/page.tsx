import { redirect } from "next/navigation";
import { commerceAuthHref } from "@/lib/commerce/commerce-auth-url";
import { getCurrentProfile } from "@/modules/users/repository";
import { getMerchantStore } from "@/modules/stores/repository";
import { getMerchantOrders } from "@/modules/orders/repository";
import { getMerchantProfile } from "@/modules/wallet/repository";
import { createClient } from "@/lib/supabase/server";
import { UsdAmount } from "@/components/payments/CurrencyAmount";

export default async function MerchantRevenuePage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect(commerceAuthHref({ auth: "signin", redirect: "/merchant/revenue" }));

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
    <div>
      <h1 className="font-heading text-3xl font-semibold">Revenue</h1>
      <p className="mt-2 text-muted">{store.name} — earnings overview</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Gross sales" value={<UsdAmount amount={totalGross} size={24} />} />
        <Stat label="Platform fees" value={<UsdAmount amount={totalFees} size={24} />} />
        <Stat label="Net received" value={<UsdAmount amount={totalNet} size={24} />} highlight />
      </div>

      <h2 className="mt-10 font-heading text-lg font-semibold">Payout wallet</h2>
      <p className="mt-2 break-all font-mono text-sm text-muted">{store.wallet_address}</p>

      <h2 className="mt-10 font-heading text-lg font-semibold">Recent paid orders</h2>
      <ul className="mt-4 space-y-2">
        {paidOrders.slice(0, 10).map((order) => (
          <li
            key={order.id}
            className="flex justify-between rounded-xl border border-border bg-card/40 px-4 py-3 text-sm"
          >
            <span className="font-mono text-xs">{order.id.slice(0, 8)}…</span>
            <UsdAmount amount={Number(order.subtotal)} size={16} />
          </li>
        ))}
        {paidOrders.length === 0 && (
          <li className="text-muted">No paid orders yet.</li>
        )}
      </ul>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <p className="text-xs uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${highlight ? "text-gold" : ""}`}>
        {value}
      </p>
    </div>
  );
}
