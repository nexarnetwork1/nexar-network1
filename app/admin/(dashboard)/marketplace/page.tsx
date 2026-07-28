import Link from "next/link";
import { getAllStores, getAllProducts } from "@/modules/platform/repository";
import { getTopMerchants, getTopProducts, getPlatformStats } from "@/modules/analytics/repository";
import { getPlatformSettings, getLatestFeeRates } from "@/modules/platform/repository";
import { UsdAmount } from "@/components/payments/CurrencyAmount";
import { MarketplaceAdminSettings } from "@/components/admin/MarketplaceAdminSettings";

export default async function AdminMarketplacePage() {
  const [stores, products, topMerchants, topProducts, stats, settings, latestFees] = await Promise.all([
    getAllStores(),
    getAllProducts(50),
    getTopMerchants(5),
    getTopProducts(5),
    getPlatformStats(),
    getPlatformSettings(),
    getLatestFeeRates(),
  ]);

  const marketplaceStores = stores.filter((s) => s.mode === "marketplace");
  const activeProducts = products.filter((p) => p.is_active);

  return (
    <div>
      <h1 className="text-3xl font-bold text-yellow-400">Marketplace</h1>
      <p className="mt-2 text-zinc-400">Catalog health, top performers, and store activity</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Marketplace stores" value={marketplaceStores.length} />
        <Stat label="Listed products" value={activeProducts.length} />
        <Stat label="Pending stores" value={stores.filter((s) => s.status === "pending").length} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-yellow-400">Top merchants</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {topMerchants.map((m) => (
              <li key={m.store_id} className="flex justify-between">
                <span>{m.store_name}</span>
                <span className="inline-flex items-center gap-1 text-zinc-400">
                  <UsdAmount amount={m.revenue} size={16} amountClassName="text-zinc-400" />
                  <span>· {m.order_count} orders</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="text-lg font-semibold text-yellow-400">Top products</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {topProducts.map((p) => (
              <li key={p.product_id} className="flex justify-between">
                <span>{p.product_name}</span>
                <span className="inline-flex items-center gap-1 text-zinc-400">
                  <span>{p.units_sold} sold ·</span>
                  <UsdAmount amount={p.revenue} size={16} amountClassName="text-zinc-400" />
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-8 flex gap-4">
        <Link href="/admin/products" className="text-sm text-yellow-400 hover:underline">
          Manage products →
        </Link>
        <Link href="/admin/merchants" className="text-sm text-yellow-400 hover:underline">
          Manage merchants →
        </Link>
      </div>

      <MarketplaceAdminSettings
        settings={settings}
        latestFees={latestFees}
        merchantCount={stores.filter((s) => s.status === "active").length}
        marketplaceRevenue={stats.platformFeeRevenue ?? 0}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5">
      <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
